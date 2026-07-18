const repeatTokenPattern = /::repeat-(\d+)$/;

export function parsePictureCommandToken(token) {
  const value = String(token);
  const match = value.match(repeatTokenPattern);
  return {
    actionId: match ? value.slice(0, match.index) : value,
    repeat: match ? Math.max(1, Number(match[1])) : 1
  };
}

export function setPictureCommandRepeat(token, repeat = 1) {
  const { actionId } = parsePictureCommandToken(token);
  return repeat > 1 ? `${actionId}::repeat-${repeat}` : actionId;
}

export function expandPictureProgram(program, multiplier = 1) {
  const expandedRule = program.flatMap((token) => {
    const { actionId, repeat } = parsePictureCommandToken(token);
    return Array.from({ length: repeat }, () => actionId);
  });
  return Array.from({ length: Math.max(1, multiplier) }, () => expandedRule).flat();
}

export function getPictureProgramStatus(program, sample, multiplier = 1) {
  const expanded = expandPictureProgram(program, multiplier);
  return {
    canRun: expanded.length > 0,
    isCorrect: expanded.length === sample.length && expanded.every((item, index) => item === sample[index])
  };
}

export function getMovementRoute(stageType, program, width, height) {
  let x = 0;
  let y = 0;
  let rotation = 0;
  const route = [{ x, y, rotation }];
  const addPoint = (deltaX, nextY, nextRotation = rotation, details = {}) => {
    x += deltaX;
    y = nextY;
    rotation = nextRotation;
    route.push({ x, y, rotation, ...details });
  };
  const addGentleCurve = (deltaX, nextY, tilt, steps = 7) => {
    const startX = x;
    const startY = y;
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const smoothProgress = progress * progress * (3 - 2 * progress);
      x = startX + deltaX * progress;
      y = startY + (nextY - startY) * smoothProgress;
      rotation = tilt * Math.sin(Math.PI * progress);
      route.push({ x, y, rotation });
    }
    rotation = 0;
    route.at(-1).rotation = 0;
  };
  const addArc = (deltaX, peakY, endY, details = {}, steps = 16) => {
    const startX = x;
    const startY = y;
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const linearY = startY + (endY - startY) * progress;
      const arcY = 4 * (peakY - (startY + endY) / 2) * progress * (1 - progress);
      x = startX + deltaX * progress;
      y = linearY + arcY;
      rotation = -8 * Math.cos(Math.PI * progress);
      route.push({ x, y, rotation });
    }
    rotation = 0;
    Object.assign(route.at(-1), { rotation: 0, ...details });
  };
  let jumpHit = 0;

  program.forEach((actionId) => {
    if (stageType === "jump") {
      if (actionId === "right") {
        if (jumpHit >= 2) addGentleCurve(width * 0.1, 0, 5, 8);
        else addPoint(width * 0.14, y);
      } else if (actionId === "jump") {
        // Redistribute the same total travel distance so the pond is cleared
        // without pushing the two stomps or the goal off their responsive marks.
        addArc(width * 0.42, height * -0.48, 0, {}, 24);
      }
      else if (actionId === "stomp") {
        const isFirst = jumpHit === 0;
        addArc(width * (isFirst ? 0.04 : 0.12), height * (isFirst ? -0.38 : -0.35), height * -0.16, { hit: jumpHit }, 16);
        jumpHit += 1;
      }
    } else if (stageType === "fish") {
      if (actionId === "swim-up-right") addGentleCurve(width * 0.14, height * -0.28, -14);
      else if (actionId === "bubble") addPoint(0, y, rotation, { bubble: true, opensShell: y <= height * -0.2 });
      else if (actionId === "swim-down-right") addGentleCurve(width * 0.14, 0, 14);
      else if (actionId === "swim-right") addGentleCurve(width * 0.12, y, 0, 5);
    } else if (stageType === "motion") {
      if (actionId === "forward-120" || actionId === "forward-80") {
        const distance = width * (actionId === "forward-120" ? 0.22 : 0.16);
        const radians = rotation * Math.PI / 180;
        addPoint(Math.cos(radians) * distance, y + Math.sin(radians) * distance, rotation);
      } else if (actionId === "turn-left-45") addPoint(0, y, rotation - 45);
      else if (actionId === "turn-right-90") addPoint(0, y, rotation + 90);
    }
  });

  return route.map((point, index) => ({
    ...point,
    offset: route.length === 1 ? 0 : index / (route.length - 1)
  }));
}

export function getJumpRoute(width, height) {
  return getMovementRoute("jump", ["right", "jump", "stomp", "stomp", "right"], width, height);
}
