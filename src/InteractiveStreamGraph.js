import React, { Component } from "react";
import * as d3 from "d3";

class InteractiveStreamGraph extends Component {
  componentDidUpdate() {
    console.log("componentDidUpdate called, props:", this.props);
    const chartData = this.props.csvData;
    console.log("Rendering chart with data:", chartData);
    // Don't render if data is empty
    if (!chartData || chartData.length === 0) {
      console.log("Data is empty, skipping render");
      return;
    }

    const colors = {
      "GPT-4": "#e41a1c",
      Gemini: "#377eb8",
      "PaLM-2": "#4daf4a",
      Claude: "#984ea3",
      "LLaMA-3.1": "#ff7f00",
    };

    // Define the LLM model names to visualize
    const llmModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];

    var xScale = d3
      .scaleTime()
      .domain(d3.extent(chartData, (d) => d.Date))
      .range([20, 600]);

    const colorScale = d3
      .scaleOrdinal()
      .domain(llmModels)
      .range(llmModels.map((model) => colors[model]));

    var stack = d3.stack().keys(llmModels).offset(d3.stackOffsetWiggle);
    var stackedSeries = stack(chartData);

    const yMin = d3.min(stackedSeries, (series) => d3.min(series, (d) => d[0]));
    const yMax = d3.max(stackedSeries, (series) => d3.max(series, (d) => d[1]));

    var yScale = d3.scaleLinear().domain([yMin, yMax]).range([400, 50]);

    var areaGenerator = d3
      .area()
      .x((d) => xScale(d.data.Date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveCardinal);

    const tooltip = d3
      .select("body")
      .selectAll(".tooltip")
      .data([null])
      .join("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("padding", "10px")
      .style("display", "none")
      .style("pointer-events", "none");

    d3.select(".svg_parent")
      .selectAll("path")
      .data(stackedSeries)
      .join("path")
      .style("fill", (d) => colorScale(d.key))
      .attr("d", (d) => areaGenerator(d))
      .on("mouseover", function (event, d) {
        const model = d.key;
        const modelData = chartData.map((p) => ({
          month: p.Date,
          value: p[model],
        }));

        const w = 300,
          h = 200,
          margin = { top: 30, right: 20, bottom: 40, left: 50 };

        tooltip.html("");

        const svg = d3
          .select(tooltip.node())
          .append("svg")
          .attr("width", w)
          .attr("height", h);

        const container = svg.append("g").attr("class", "container");

        const xScaleTooltip = d3
          .scaleBand()
          .domain(modelData.map((d) => d.month))
          .range([margin.left, w - margin.right])
          .padding(0.2);

        const yScaleTooltip = d3
          .scaleLinear()
          .domain([0, d3.max(modelData, (d) => d.value)])
          .range([h - margin.bottom, margin.top]);

        container
          .selectAll("rect")
          .data(modelData)
          .join("rect")
          .attr("x", (d) => xScaleTooltip(d.month))
          .attr("y", (d) => yScaleTooltip(d.value))
          .attr("width", xScaleTooltip.bandwidth())
          .attr("height", (d) => h - margin.bottom - yScaleTooltip(d.value))
          .attr("fill", colorScale(model));

        svg
          .append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(0, ${h - margin.bottom})`)
          .call(d3.axisBottom(xScaleTooltip).tickFormat(d3.timeFormat("%b")));

        svg
          .append("g")
          .attr("class", "y-axis")
          .attr("transform", `translate(${margin.left}, 0)`)
          .call(d3.axisLeft(yScaleTooltip).ticks(5));

        svg
          .append("text")
          .attr("x", w / 2)
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .text(model);

        tooltip
          .style("display", "block")
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - h - 20 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("display", "none");
      });

    d3.select(".svg_parent")
      .selectAll(".x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, 410)`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(d3.timeMonth.every(1))
          .tickFormat(d3.timeFormat("%b"))
      );

    const legend = d3
      .select(".svg_parent")
      .selectAll(".legend")
      .data(llmModels.reverse())
      .join("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(620, ${50 + i * 25})`);

    legend
      .append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .transition()
      .duration(3000)
      .attr("fill", (d) => colorScale(d));

    legend
      .append("text")
      .attr("x", 20)
      .attr("y", 12)
      .style("font-size", "12px")
      .text((d) => d);
  }

  render() {
    return (
      <svg style={{ width: 800, height: 500 }} className="svg_parent"></svg>
    );
  }
}

export default InteractiveStreamGraph;
