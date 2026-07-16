const assert = require("node:assert/strict");
const path = require("node:path");
const Module = require("node:module");

require("sucrase/register");

const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const originalResolveFilename = Module._resolveFilename;
const originalLoad = Module._load;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(srcRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const React = require("react");
const { renderToString } = require("react-dom/server");
global.React = React;

const originalConsoleError = console.error.bind(console);
const originalConsoleWarn = console.warn.bind(console);

function isKnownJsxHarnessWarning(args) {
  const [message] = args;
  return (
    typeof message === "string" &&
    message.includes("outdated JSX transform")
  );
}

console.error = (...args) => {
  if (isKnownJsxHarnessWarning(args)) {
    return;
  }

  originalConsoleError(...args);
};

console.warn = (...args) => {
  if (isKnownJsxHarnessWarning(args)) {
    return;
  }

  originalConsoleWarn(...args);
};

Module._load = function load(request, parent, isMain) {
  if (request === "next/link") {
    return function Link({ href, children, prefetch, replace, scroll, shallow, locale, ...props }) {
      return React.createElement("a", { href: hrefToString(href), ...props }, children);
    };
  }

  if (request === "next/image") {
    return function Image({
      src,
      alt = "",
      width,
      height,
      priority,
      placeholder,
      blurDataURL,
      quality,
      sizes,
      fill,
      loader,
      unoptimized,
      ...props
    }) {
      return React.createElement("img", {
        src: hrefToString(src),
        alt,
        width,
        height,
        ...props,
      });
    };
  }

  if (request === "next/navigation") {
    return {
      useParams: () => ({ runId: "9001" }),
      usePathname: () => "/demo",
      useRouter: () => ({
        push() {},
        replace() {},
        refresh() {},
      }),
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { ResultsShell } = require("../src/components/results/ResultsShell");
const {
  ResultErrorState,
  ResultLoadingState,
} = require("../src/components/results/ResultPageStates");
const { adaptAnalysisRun } = require("../src/lib/analysisAdapter");
const DemoPage = require("../src/app/demo/page").default;
const staticDemo = require("../src/data/staticDemoAnalysis.json");

const cases = [
  {
    name: "normal backend result",
    html: () => renderResultsShell(makeRun({ model_name: "gpt-demo-model" })),
    includes: ["Recommended ICP", "Candidate Market Scores", "Outreach Strategy", "Action Plan"],
  },
  {
    name: "deterministic fallback result",
    html: () => renderResultsShell(makeDeterministicFallbackRun()),
    includes: ["Fallback GTM Co", "Recommended ICP", "Candidate Market Scores", "Outreach Strategy"],
  },
  {
    name: "no benchmarks",
    html: () =>
      renderResultsShell(
        makeRun({}, (run) => {
          run.agent_output.external_benchmarks = [];
        })
      ),
    includes: ["No market benchmarks were returned", "Recommended ICP"],
  },
  {
    name: "no action plan",
    html: () =>
      renderResultsShell(
        makeRun({ action_plan: null, review_status: "approved" }, (run) => {
          run.error_message = null;
        })
      ),
    includes: ["No action plan has been generated yet", "Generate plan"],
  },
  {
    name: "low confidence ICP",
    html: () =>
      renderResultsShell(
        makeRun({ mode: "no_history" }, (run) => {
          run.agent_output.icp.confidence = "low";
          run.agent_output.icp.confidence_basis =
            "Low confidence because the run has assumptions but limited sales evidence.";
        })
      ),
    includes: ["Low confidence", "No-History Assumptions", "Low confidence because"],
  },
  {
    name: "failed refinement",
    html: () =>
      renderResultsShell(
        makeRun({ error_message: "refinement output was not usable" })
      ),
    includes: [
      "Last workflow step needs attention",
      "refinement output was not usable",
      "Recommended ICP",
    ],
  },
  {
    name: "backend slow response",
    html: () => renderToString(React.createElement(ResultLoadingState)),
    includes: ["Loading results", "Recommended ICP", "Action Plan"],
  },
  {
    name: "result not found error",
    html: () =>
      renderToString(
        React.createElement(ResultErrorState, {
          error: {
            kind: "not_found",
            title: "Result not found",
            message: "This workflow result could not be found.",
          },
        })
      ),
    includes: ["Result not found", "could not be found"],
  },
  {
    name: "static demo route",
    html: () => renderToString(React.createElement(DemoPage)),
    includes: ["Backend-free analysis flow", "Static intake", "Recommended ICP", "Action Plan"],
  },
];

let failures = 0;

for (const demoCase of cases) {
  try {
    const html = demoCase.html();
    assert.equal(typeof html, "string");
    assert.ok(html.length > 0, `${demoCase.name} rendered empty markup`);
    for (const expectedText of demoCase.includes) {
      assert.ok(
        html.includes(expectedText),
        `${demoCase.name} markup did not include "${expectedText}"`
      );
    }
    console.log(`PASS ${demoCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${demoCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
}

function renderResultsShell(apiRun) {
  const run = adaptAnalysisRun(apiRun);
  return renderToString(
    React.createElement(ResultsShell, {
      run,
      onRefresh: async () => run,
      onRunUpdated: (updatedRun) => adaptAnalysisRun(updatedRun),
    })
  );
}

function makeRun(overrides = {}, mutate) {
  const run = clone(staticDemo.run);
  Object.assign(run, overrides);
  mutate?.(run);
  return run;
}

function makeDeterministicFallbackRun() {
  return makeRun(
    {
      id: 9102,
      run_id: 9102,
      mode: "no_history",
      model_name: "deterministic-fallback-v1",
      action_plan: null,
      review_status: "needs_review",
    },
    (run) => {
      run.company = {
        ...run.company,
        id: 9102,
        name: "Fallback GTM Co",
        industry: "Healthcare operations",
        description: "Helps operators reduce scheduling bottlenecks with workflow automation.",
      };
      run.input_snapshot = {
        name: "Fallback GTM Co",
        mode: "no_history",
        industry: "Healthcare operations",
        description: "Helps operators reduce scheduling bottlenecks with workflow automation.",
        problem_solved: "Manual scheduling creates patient access delays.",
        target_user_guess: "Clinic operations leaders",
        hypothetical_ticket: 12000,
      };
      run.agent_output = {
        diagnosis:
          "Fallback GTM Co should narrow its first sales motion around operations leaders with measurable workflow bottlenecks.",
        external_benchmarks: [
          {
            stat: "Prioritize segments where the pain can be measured in revenue, cost, cycle time, or risk.",
            source: "SalesCompass ICP heuristic",
          },
        ],
        markets: [
          {
            name: "Operations leaders with measurable workflow bottlenecks",
            scores: {
              size: 8,
              access: 7,
              ticket: 7,
              cycle: 7,
              competition: 6,
            },
            total: 7,
            rationale:
              "No customer history means confidence depends on pain clarity. Demo market data supports a short validation pass before scaling.",
          },
          {
            name: "Healthcare administrators with patient access pressure",
            scores: {
              size: 8,
              access: 6,
              ticket: 7,
              cycle: 6,
              competition: 5,
            },
            total: 6,
            rationale:
              "Healthcare has persistent workflow pain but needs validation around compliance and procurement friction.",
          },
        ],
        icp: {
          profile:
            "Clinic operations leaders at healthcare groups trying to reduce scheduling delays.",
          company_size: "Mid-market or focused growth teams",
          target_industry: "Healthcare operations",
          region: "Start with reachable markets from the current network",
          decision_maker: "Head of Operations",
          main_pain: "Manual scheduling creates patient access delays.",
          rationale:
            "The deterministic fallback combines fit, urgency, reachability, and deal quality signals.",
          confidence: "medium",
          confidence_basis:
            "The fallback has a clear pain hypothesis but limited direct customer history.",
        },
        approach: {
          channel: "Email",
          trigger: "A measurable workflow delay tied to patient access",
          first_contact: "Head of Operations",
          message_tone: "Specific, evidence-led, and concise",
          sample_message:
            "Are scheduling delays creating measurable access or staff-utilization pressure this quarter?",
          confidence: "medium",
          confidence_basis:
            "Message should be tested against reply quality before scaling.",
        },
        hypotheses_to_validate: [
          "Operations leaders can quantify scheduling delay cost.",
          "A narrow healthcare operator list produces higher-quality replies than broad outreach.",
        ],
        questions_for_human: [
          "Which operator role owns the scheduling metric?",
          "What trigger makes this urgent now?",
        ],
      };
      run.baseline_output = {
        segment: "healthcare operations",
        icp: "Companies in healthcare operations",
        confidence: "medium",
        rationale: "Naively selected based on the stated industry.",
        outreach: {
          channel: "cold email",
          message: "Worth a quick conversation about scheduling workflows?",
        },
      };
    }
  );
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hrefToString(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object" && "src" in value) {
    return String(value.src);
  }

  return "#";
}
