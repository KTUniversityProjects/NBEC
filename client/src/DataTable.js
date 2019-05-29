import React, { Component } from "react";

export default class DataTable extends Component {
  isSpam = item => {
    if (item[0].includes("ne")) {
      if (item[1].text === "NOT SPAM") {
        return "red";
      } else return "green";
    } else {
      if (item[1].text === "SPAM") {
        return "red";
      } else {
        return "green";
      }
    }
  };

  render() {
    return (
      <div>
        <table>
          <thead>
            <tr className="gray">
              <th>Filename</th>
              <th className="center">Precent</th>
              <th className="center">Prediction</th>
            </tr>
          </thead>
          <tbody>
            {this.props.data.map((item, index) => (
              <tr key={index} className={this.isSpam(item)}>
                <td>{item[0]}</td>
                <td className="center">
                  {Number.parseFloat(item[1].precent).toFixed(2)}
                </td>
                <td className="center">{item[1].text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
