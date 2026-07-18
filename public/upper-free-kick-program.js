import {
  clampLessonValue,
  createKickPath,
  doesKickClearWall,
  kickTargetForce
} from "./upper-picture-lesson-logic.js?v=20260717s";

export const kickCorrectionActions = Object.freeze([
  Object.freeze({ id: "x-plus", label: "xを10増やす", variable: "x", delta: 10 }),
  Object.freeze({ id: "x-minus", label: "xを10減らす", variable: "x", delta: -10 }),
  Object.freeze({ id: "y-plus", label: "yを10増やす", variable: "y", delta: 10 }),
  Object.freeze({ id: "y-minus", label: "yを10減らす", variable: "y", delta: -10 }),
  Object.freeze({ id: "stop", label: "止める", stop: true })
]);

export const kickOutcomeLabels = Object.freeze({
  wall: "壁に当たった",
  short: "手前に落ちた",
  over: "飛びすぎた",
  goal: "ゴール！"
});

export function classifyKickOutcome(forces) {
  if (!doesKickClearWall(forces)) return "wall";
  const finish = createKickPath(forces).at(-1);
  const target = createKickPath(kickTargetForce).at(-1);
  if (finish.x < target.x - 12) return "short";
  if (finish.x > target.x + 12) return "over";
  return "goal";
}

export function applyKickProgram(forces, program) {
  const currentForce = {
    x: clampLessonValue(forces?.x, 20, 200, 90),
    y: clampLessonValue(forces?.y, 40, 240, 100)
  };
  const outcome = classifyKickOutcome(currentForce);
  const rule = program.find((candidate) => candidate.outcome === outcome) ?? null;
  const action = kickCorrectionActions.find((candidate) => candidate.id === rule?.actionId) ?? null;
  const nextForce = { ...currentForce };
  if (action?.variable) {
    const bounds = action.variable === "x" ? [20, 200] : [40, 240];
    nextForce[action.variable] = clampLessonValue(
      nextForce[action.variable] + action.delta,
      bounds[0],
      bounds[1],
      nextForce[action.variable]
    );
  }
  return {
    currentForce,
    nextForce,
    outcome,
    rule,
    action,
    stopped: Boolean(action?.stop)
  };
}

export function simulateKickProgram(initialForce, program, maximumAttempts = 10) {
  const limit = Math.max(1, Math.min(10, Math.round(maximumAttempts)));
  const attempts = [];
  let force = { ...initialForce };
  let reason = "maximum-attempts";

  for (let attempt = 1; attempt <= limit; attempt += 1) {
    const result = applyKickProgram(force, program);
    attempts.push({ attempt, ...result });
    if (result.stopped) {
      reason = "goal-stop";
      break;
    }
    if (!result.rule || !result.action) {
      reason = "missing-rule";
      break;
    }
    force = result.nextForce;
  }

  return {
    attempts,
    reason,
    success: reason === "goal-stop",
    finalForce: attempts.at(-1)?.nextForce ?? { ...initialForce }
  };
}
