import React, { Component } from "react";
import { Chart } from "react-charts";

export default class BaseChart extends Component {
  render() {
    return (
      <div className="chart">
        <h1>{this.props.label}</h1>
        <Chart
          data={[this.props.data]}
          getLabel={series => series.label}
          axes={[
            { primary: true, type: "linear", position: "bottom" },
            { type: "linear", position: "left" }
          ]}
        />
      </div>
    );
  }
}
