const SVG_NS = "http://www.w3.org/2000/svg";
const tree = document.querySelector("#family-tree");
const svg = tree?.querySelector(".connections");
const families = JSON.parse(
  document.querySelector("#family-data")?.textContent ?? "[]"
);
const guardianshipData = JSON.parse(
  document.querySelector("#guardianship-data")?.textContent ??
    '{"guardianships":[],"label":"Raised by"}'
);
const previewDate = new URLSearchParams(window.location.search).get(
  "previewDate"
);

if (previewDate) {
  const dateLine = document.querySelector(".preview-date");
  if (dateLine) {
    dateLine.textContent = previewDate;
    dateLine.hidden = false;
  }
}

function drawConnections() {
  if (!tree || !svg) {
    return;
  }

  for (const relationship of tree.querySelectorAll(
    ".relationship.has-children"
  )) {
    if (relationship.parentElement !== tree) {
      relationship.style.left = "0px";
      relationship.style.top = "0px";
      tree.append(relationship);
    }
  }

  const treeRect = tree.getBoundingClientRect();
  svg.setAttribute("width", tree.scrollWidth);
  svg.setAttribute("height", tree.scrollHeight);
  svg.setAttribute("viewBox", `0 0 ${tree.scrollWidth} ${tree.scrollHeight}`);
  svg.replaceChildren();
  const placedRelationshipLabels = [];

  for (const family of families) {
    const relationship = tree.querySelector(
      `[data-family-id="${CSS.escape(family.id)}"]`
    );
    if (!relationship) {
      continue;
    }

    const partners = family.partners
      .map((id) =>
        tree.querySelector(`[data-person-id="${CSS.escape(id)}"]`)
      )
      .filter(Boolean)
      .map((element) => relativeRect(element, treeRect));

    if (partners.length === 0) {
      continue;
    }

    const children = family.children
      .map((id) =>
        tree.querySelector(`[data-person-id="${CSS.escape(id)}"]`)
      )
      .filter(Boolean)
      .map((element) => relativeRect(element, treeRect));

    if (children.length === 0) {
      const relationshipRect = relativeRect(relationship, treeRect);
      const relationshipCenter = center(relationshipRect);
      drawPartnerLines(partners, relationshipCenter);
      continue;
    }

    const partnerCenters = partners.map(center);
    const sourceX =
      partnerCenters.reduce((sum, partner) => sum + partner.x, 0) /
      partnerCenters.length;
    const sourceY =
      partnerCenters.reduce((sum, partner) => sum + partner.y, 0) /
      partnerCenters.length;
    const childCenters = children.map((child) => ({
      x: center(child).x,
      y: child.top
    }));
    const firstChildY = Math.min(...childCenters.map((child) => child.y));
    const lastPartnerY = Math.max(
      sourceY,
      ...partners.map((partner) => partner.bottom)
    );
    const branchY = lastPartnerY + (firstChildY - lastPartnerY) * 0.45;
    const minX = Math.min(sourceX, ...childCenters.map((child) => child.x));
    const maxX = Math.max(sourceX, ...childCenters.map((child) => child.x));
    placeRelationshipLabel(relationship, sourceX, branchY, minX, maxX);

    drawPartnerLines(partners, { x: sourceX, y: sourceY });
    drawPath(`M ${sourceX} ${sourceY} V ${branchY}`, "family-line");
    drawPath(`M ${minX} ${branchY} H ${maxX}`, "family-line");
    for (const child of childCenters) {
      drawPath(`M ${child.x} ${branchY} V ${child.y}`, "family-line");
    }
  }

  for (const guardianship of guardianshipData.guardianships) {
    drawGuardianship(guardianship, treeRect);
  }

  function drawPartnerLines(partners, relationshipCenter) {
    for (const partner of partners) {
      const partnerCenter = center(partner);
      const startX =
        partnerCenter.x < relationshipCenter.x ? partner.right : partner.left;
      drawPath(
        `M ${startX} ${partnerCenter.y} H ${relationshipCenter.x}`,
        "family-line"
      );
    }
  }

  function placeRelationshipLabel(
    relationship,
    preferredX,
    y,
    branchMinX,
    branchMaxX
  ) {
    const width = relationship.offsetWidth;
    const height = relationship.offsetHeight;
    const step = width + 8;
    const candidates = [preferredX];

    for (let offset = step; offset <= branchMaxX - branchMinX; offset += step) {
      candidates.push(preferredX + offset, preferredX - offset);
    }

    const x =
      candidates.find(
        (candidate) =>
          candidate >= branchMinX &&
          candidate <= branchMaxX &&
          !placedRelationshipLabels.some(
            (placed) =>
              Math.abs(candidate - placed.x) < (width + placed.width) / 2 + 8 &&
              Math.abs(y - placed.y) < (height + placed.height) / 2 + 8
          )
      ) ?? preferredX;

    relationship.style.left = `${x}px`;
    relationship.style.top = `${y}px`;
    placedRelationshipLabels.push({ x, y, width, height });
  }
}

function drawGuardianship(guardianship, treeRect) {
  const child = tree.querySelector(
    `[data-person-id="${CSS.escape(guardianship.child)}"]`
  );
  const guardianElements = guardianship.guardians
    .map((id) =>
      tree.querySelector(`[data-person-id="${CSS.escape(id)}"]`)
    )
    .filter(Boolean);
  if (!child || guardianElements.length !== guardianship.guardians.length) {
    return;
  }

  const guardianFamily = families.find(
    (family) =>
      family.partners.length === guardianship.guardians.length &&
      family.partners.every((id) => guardianship.guardians.includes(id))
  );
  const relationship = guardianFamily
    ? tree.querySelector(
        `[data-family-id="${CSS.escape(guardianFamily.id)}"]`
      )
    : null;
  const childRect = relativeRect(child, treeRect);
  const guardianRects = guardianElements.map((element) =>
    relativeRect(element, treeRect)
  );
  const sourceRect = relationship
    ? relativeRect(relationship, treeRect)
    : {
        bottom: Math.max(...guardianRects.map((rect) => rect.bottom)),
        left: Math.min(...guardianRects.map((rect) => rect.left)),
        width:
          Math.max(...guardianRects.map((rect) => rect.right)) -
          Math.min(...guardianRects.map((rect) => rect.left))
      };
  const sourceX = center(sourceRect).x;
  const sourceY = sourceRect.bottom;
  const targetX = center(childRect).x;
  const targetY = childRect.bottom;
  const routeY = Math.max(
    sourceY,
    targetY,
    ...guardianRects.map((rect) => rect.bottom)
  ) + 24;

  drawPath(
    `M ${sourceX} ${sourceY} V ${routeY} H ${targetX} V ${targetY}`,
    "guardianship-line"
  );
  drawText(
    (sourceX + targetX) / 2,
    routeY - 8,
    guardianshipData.label,
    "guardianship-label"
  );
}

function relativeRect(element, treeRect) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top - treeRect.top,
    right: rect.right - treeRect.left,
    bottom: rect.bottom - treeRect.top,
    left: rect.left - treeRect.left,
    width: rect.width,
    height: rect.height
  };
}

function center(rect) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function drawPath(pathData, className) {
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", pathData);
  path.setAttribute("class", className);
  svg.append(path);
}

function drawText(x, y, textContent, className) {
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("class", className);
  text.setAttribute("text-anchor", "middle");
  text.textContent = textContent;
  svg.append(text);
}

document.fonts.ready.then(drawConnections);
window.addEventListener("resize", drawConnections);
new ResizeObserver(drawConnections).observe(tree);
