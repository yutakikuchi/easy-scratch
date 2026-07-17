export const rescueTargetValues = Object.freeze({ right: 120, up: 80, left: 40, down: 60 });
export const rescueInitialValues = Object.freeze({ right: 90, up: 50, left: 70, down: 90 });
export const rescueTargetProgram = Object.freeze(["right", "up", "right", "down", "right", "up"]);
export const rescueGridUnit = 20;
export const rescueStart = Object.freeze({ x: -180, y: 40 });

export const kickTargetForce = Object.freeze({ x: 120, y: 140 });
export const kickInitialForce = Object.freeze({ x: 90, y: 100 });
export const kickDuration = 2;
export const kickGravity = 140;
export const kickWall = Object.freeze({ x: 120, topY: -26 });

export const patternTarget = Object.freeze({ distance: 80, angle: 60, count: 6 });

const directionVectors = {
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  down: { x: 0, y: 1 }
};

function sameNumber(left, right) {
  return Math.abs(Number(left) - Number(right)) < 0.001;
}

function normalizedAngle(value) {
  return ((value % 360) + 360) % 360;
}

export function clampLessonValue(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function mapRescuePoint(point, width, height) {
  const scale = Math.max(0.1, Math.min((width - 90) / 440, (height - 70) / 280));
  return {
    x: width / 2 + point.x * scale,
    y: height / 2 + point.y * scale,
    rotation: point.rotation ?? 0,
    offset: point.offset ?? 0
  };
}

export function createRescueCoordinateGrid(width, height) {
  const origin = mapRescuePoint(rescueStart, width, height);
  const columns = [];
  const rows = [];
  const scale = Math.max(0.1, Math.min((width - 90) / 440, (height - 70) / 280));
  const labelEvery = [40, 80, 120, 160].find((interval) => interval * scale >= 48) ?? 200;

  for (let value = -200; value <= 520; value += rescueGridUnit) {
    const point = mapRescuePoint({ x: rescueStart.x + value, y: rescueStart.y }, width, height);
    if (point.x >= 0 && point.x <= width) columns.push({ value, position: point.x, major: value % 40 === 0 });
  }
  for (let value = -240; value <= 320; value += rescueGridUnit) {
    const point = mapRescuePoint({ x: rescueStart.x, y: rescueStart.y - value }, width, height);
    if (point.y >= 0 && point.y <= height) rows.push({ value, position: point.y, major: value % 40 === 0 });
  }

  return { unit: rescueGridUnit, labelEvery, origin, columns, rows };
}

export function createRescueRoute(program, values, start = rescueStart) {
  let x = start.x;
  let y = start.y;
  const route = [{ x, y, direction: null, value: 0 }];

  program.forEach((command) => {
    const direction = typeof command === "string" ? command : command?.direction;
    const vector = directionVectors[direction];
    if (!vector) return;
    const commandValue = typeof command === "string" ? values?.[direction] : command?.value;
    const value = clampLessonValue(commandValue, 0, 240, 0);
    x += vector.x * value;
    y += vector.y * value;
    route.push({ x, y, direction, value });
  });

  return route.map((point, index) => ({
    ...point,
    offset: route.length <= 1 ? 0 : index / (route.length - 1)
  }));
}

export function isRescueCorrect(program, values) {
  const orderMatches =
    program.length === rescueTargetProgram.length &&
    program.every((command, index) => {
      const direction = typeof command === "string" ? command : command?.direction;
      const commandValue = typeof command === "string" ? values?.[direction] : command?.value;
      return direction === rescueTargetProgram[index] && sameNumber(commandValue, rescueTargetValues[direction]);
    });
  return orderMatches;
}

export function createKickPath(forces, samples = 40) {
  const xForce = clampLessonValue(forces?.x, 20, 200, kickTargetForce.x);
  const yForce = clampLessonValue(forces?.y, 40, 240, kickTargetForce.y);
  const sampleCount = Math.max(4, Math.round(samples));
  const landingTime = Math.min(kickDuration, 2 * yForce / kickGravity);
  const wallTime = kickWall.x / xForce;
  const hitsWall = wallTime <= landingTime && !doesKickClearWall({ x: xForce, y: yForce });
  const travelTime = hitsWall ? wallTime : landingTime;
  return Array.from({ length: sampleCount + 1 }, (_, index) => {
    const offset = index / sampleCount;
    const time = travelTime * offset;
    return {
      x: xForce * time,
      y: index === sampleCount && !hitsWall ? 0 : -yForce * time + kickGravity * time * time / 2,
      rotation: 720 * offset,
      time,
      offset
    };
  });
}

export function isKickCorrect(forces) {
  const finish = createKickPath(forces).at(-1);
  const target = createKickPath(kickTargetForce).at(-1);
  return doesKickClearWall(forces) && Math.abs(finish.x - target.x) <= 12 && Math.abs(finish.y - target.y) <= 12;
}

export function doesKickClearWall(forces) {
  const xForce = clampLessonValue(forces?.x, 20, 200, kickTargetForce.x);
  const yForce = clampLessonValue(forces?.y, 40, 240, kickTargetForce.y);
  const timeAtWall = kickWall.x / xForce;
  if (timeAtWall < 0 || timeAtWall > kickDuration) return false;
  const yAtWall = -yForce * timeAtWall + kickGravity * timeAtWall * timeAtWall / 2;
  return yAtWall <= kickWall.topY;
}

export function createPatternRoute(values, start = { x: 0, y: 0 }) {
  const distance = clampLessonValue(values.distance, 1, 200, patternTarget.distance);
  const angle = clampLessonValue(values.angle, 1, 180, patternTarget.angle);
  const count = Math.round(clampLessonValue(values.count, 1, 12, patternTarget.count));
  let x = start.x;
  let y = start.y;
  let rotation = 0;
  const route = [{ x, y, rotation, draws: false, iteration: 0 }];

  for (let iteration = 0; iteration < count; iteration += 1) {
    const radians = rotation * Math.PI / 180;
    x += Math.cos(radians) * distance;
    y += Math.sin(radians) * distance;
    route.push({ x, y, rotation, draws: true, iteration: iteration + 1 });
    rotation = normalizedAngle(rotation + angle);
    route.push({ x, y, rotation, draws: false, iteration: iteration + 1 });
  }

  return route.map((point, index) => ({
    ...point,
    offset: route.length <= 1 ? 0 : index / (route.length - 1)
  }));
}

export function isPatternCorrect(values) {
  return sameNumber(values.distance, patternTarget.distance) &&
    sameNumber(values.angle, patternTarget.angle) &&
    Math.round(values.count) === patternTarget.count;
}
