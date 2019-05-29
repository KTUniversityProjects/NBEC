import React, { Component } from "react";
import "./App.css";
import BaseChart from "./BaseChart.js";
import DataTable from "./DataTable.js";

class App extends Component {
  state = {
    fetched: false,
    disabled: false,
    data: [],
    graphData: []
  };

  handleSubmit = async e => {
    e.preventDefault();
    this.setState({ disabled: true });
    const response = await fetch("/api/world", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const res = await response.json();
    const data = [
      {
        label: "SNV",
        data: []
      },
      {
        label: "SC",
        data: []
      },
      {
        label: "NV",
        data: []
      }
    ];
    let cnt = 0;
    for (let i = 0; i < 3; i++) {
      data[0].data.push([
        res[cnt].params.settingNeutralValue,
        res[cnt].countResult.acc.acc
      ]);
      cnt++;
    }
    for (let i = 0; i < 3; i++) {
      data[1].data.push([
        res[cnt].params.neutralValue,
        res[cnt].countResult.acc.acc
      ]);
      cnt++;
    }
    for (let i = 0; i < 3; i++) {
      data[2].data.push([
        res[cnt].params.SEGcount,
        res[cnt].countResult.acc.acc
      ]);
      cnt++;
    }
    this.setState({ data: res, fetched: true, graphData: data });
  };

  render() {
    console.log(this.state.data);
    return (
      <div className="App">
        <header className="App-header">
          <h1>SPAM CLASSIFICATOR</h1>
        </header>
        {this.state.fetched ? (
          <button disabled> Done </button>
        ) : this.state.disabled ? (
          <button disabled>
            <div className="lds-dual-ring" />
            Fetching
          </button>
        ) : (
          <button onClick={this.handleSubmit}>Classificate files</button>
        )}
        {this.state.fetched === true ? (
          <div>
            <BaseChart data={this.state.graphData[0]} label="SNV" />
            <BaseChart data={this.state.graphData[1]} label="NV" />
            <BaseChart data={this.state.graphData[2]} label="SC" />
          </div>
        ) : null}

        {this.state.data.map((item, index) => (
          <div>
            <h3>
              KFCV average: {item.countResult.kfc}, True positive:{" "}
              {item.countResult.acc.tp}, false positive:{" "}
              {item.countResult.acc.fp}, accuracy: {item.countResult.acc.acc},
              total data amount: {item.countResult.acc.size}
            </h3>
            <br />
            <h2>
              Params: SNV: {item.params.settingNeutralValue}, NV:{" "}
              {item.params.neutralValue}, SEGcount: {item.params.SEGcount}{" "}
            </h2>
            <DataTable key={index} data={item.countResult.data} />
          </div>
        ))}
      </div>
    );
  }
}
export default App;
