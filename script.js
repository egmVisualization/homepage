// ===== Projects chart =====
const CSV_PATH = "publications-test-data.csv";

d3.csv(CSV_PATH).then(function(rows) {

  // 1. Group the rows by publication type: count them and collect their URLs
  const grouped = d3.rollups(
    rows,
    group => ({
      count: group.length,
      urls: group.map(d => d.URL).filter(url => url && url.trim() !== "")
    }),
    d => d["Publication type"]
  );

  // 2. Reshape into a simple list, sorted largest to smallest
  const data = grouped
    .map(([type, info]) => ({ type: type, count: info.count, urls: info.urls }))
    .sort((a, b) => b.count - a.count);

  // 3. Chart size: the height grows with the number of publication types
  const barHeight = 40;
  const margin = { top: 10, right: 20, bottom: 10, left: 200 };
  const width = 700;
  const height = margin.top + margin.bottom + data.length * barHeight;

  const svg = d3.select("#projects-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", "100%");

  // 4. Scales: counts become bar lengths, types become vertical positions
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count)])
    .range([margin.left, width - margin.right]);

  const y = d3.scaleBand()
    .domain(data.map(d => d.type))
    .range([margin.top, height - margin.bottom])
    .padding(0.25);

  // 5. The tooltip: one box, reused for every bar
  const tooltip = d3.select("#projects-chart")
    .append("div")
    .attr("class", "chart-tooltip");

  let hideTimer;

  function showTooltip(event, d) {
    clearTimeout(hideTimer);

    let content = `<strong>${d.type}</strong><br>${d.count} project${d.count === 1 ? "" : "s"}`;

    if (d.urls.length > 0) {
      const randomUrl = d.urls[Math.floor(Math.random() * d.urls.length)];
      content += `<br><a href="${randomUrl}" target="_blank" rel="noopener">See example of ${d.type} work →</a>`;
    }

    const [mouseX, mouseY] = d3.pointer(event, document.querySelector("#projects-chart"));

    tooltip
      .html(content)
      .style("left", (mouseX + 15) + "px")
      .style("top", (mouseY - 10) + "px")
      .classed("visible", true);
  }

  function hideTooltipSoon() {
    hideTimer = setTimeout(() => tooltip.classed("visible", false), 400);
  }

  // Keep the tooltip open while the mouse is inside it, so the link is clickable
  tooltip
    .on("mouseenter", () => clearTimeout(hideTimer))
    .on("mouseleave", hideTooltipSoon);

  // 6. Draw the bars
  svg.selectAll(".project-bar")
    .data(data)
    .join("rect")
    .attr("class", "project-bar")
    .attr("x", x(0))
    .attr("y", d => y(d.type))
    .attr("width", d => x(d.count) - x(0))
    .attr("height", y.bandwidth())
    .on("mouseenter", showTooltip)
    .on("mouseleave", hideTooltipSoon);

  // 7. Label each bar with its publication type
  svg.selectAll(".project-label")
    .data(data)
    .join("text")
    .attr("class", "project-label")
    .attr("x", margin.left - 12)
    .attr("y", d => y(d.type) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d.type);

})
.catch(error => console.error("Could not load the CSV:", error));