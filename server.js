//--------FOR CLASSIFICATION----------//
//--------------CONSTANTS-------------//
const trainDir = __dirname + "\\train\\";
const validateDir = __dirname + "\\validate\\";
const testDir = __dirname + "\\test\\";
const NSEGMENTS = 10;
function main(snv, nv, sc, ns) {
  //----------Local vars----------------//
  let settingNeutralValue = snv;
  let neutralValue = nv;
  let SEGcount = sc;
  let NSEGMENTS = ns;
  //------------Training----------------//
  let probs = new Map();
  train(probs, trainDir);
  //-----------Validation---------------//
  let kfcvavg = kfcv();
  //-------------Testing----------------//
  let fileProbs = new Map();
  classificate(fileProbs, probs);
  //-----------Performance--------------//
  let classificatorAccuracy = benchmark(fileProbs);
  //------------------------------------//
  return { acc: classificatorAccuracy, kfc: kfcvavg, dataMap: fileProbs };

  //-----------Functions----------------//
  function calculateProbabilities(reps, probs) {
    let spamCount = reps.spamCount;
    let hamCount = reps.hamCount;
    for (const k of reps.keys()) {
      let rec = reps.get(k);
      let pws = rec.spam / spamCount;
      let pwh = rec.ham / hamCount;
      let prob = 0;
      if (pwh == 0) prob = 0.99;
      else if (pws == 0) prob = 0.01;
      else prob = pws / (pws + pwh);
      probs.set(k, prob);
    }
  }

  function train(probs, dirname) {
    let reps = new Map();
    reps.spamCount = 0;
    reps.hamCount = 0;
    const fs = require("fs");
    fs.readdirSync(dirname).forEach(filename => {
      let content = fs.readFileSync(dirname + filename, "utf-8");
      store(reps, content, filename);
    });
    calculateProbabilities(reps, probs);
  }

  function store(dataSet, content, filename) {
    let parts = content.split(/[^A-Za-z0-9$'"]/).filter(x => x);
    parts.forEach(part => {
      part = part.toLowerCase();
      if (!filename.includes("ne")) {
        dataSet.spamCount++;
        if (!dataSet.has(part)) {
          dataSet.set(part, { spam: 1, ham: 0 });
        } else {
          let tempRec = dataSet.get(part);
          dataSet.set(part, { spam: tempRec.spam + 1, ham: tempRec.ham });
        }
      } else {
        dataSet.hamCount++;
        if (!dataSet.has(part)) {
          dataSet.set(part, { spam: 0, ham: 1 });
        } else {
          let tempRec = dataSet.get(part);
          dataSet.set(part, { spam: tempRec.spam, ham: tempRec.ham + 1 });
        }
      }
    });
  }

  function classificate(fileProbs, probs) {
    //Read file names
    const fs = require("fs");
    let filenames = fs.readdirSync(testDir);
    filenames.forEach(filename => {
      classificateFile(
        fileProbs,
        probs,
        fs.readFileSync(testDir + filename, "utf-8"),
        filename
      );
    });
  }

  function classificateFile(fileProbs, probs, content, fileName) {
    let parts = content.split(/[^A-Za-z0-9$'"]/).filter(x => x);
    let localProbs = new Map();
    //Get current file probabilities map
    parts.forEach(part => {
      part = part.toLowerCase();
      if (probs.has(part)) {
        localProbs.set(part, probs.get(part));
      } else {
        localProbs.set(part, settingNeutralValue);
      }
    });
    //Collect highest probabilities
    let collectedProbs = new Map();
    for (let i = 0; i < SEGcount; i++) {
      let minKey = Array.from(localProbs.keys())[0];
      let minDist = Math.abs(neutralValue - localProbs.get(minKey));
      for (const [key, value] of localProbs.entries()) {
        let currentDist = Math.abs(neutralValue - value);
        if (currentDist > minDist) {
          minKey = key;
          minDist = currentDist;
        }
      }
      collectedProbs.set(minKey, localProbs.get(minKey));
      localProbs.delete(minKey);
    }
    let probMultiplied = 1;
    let probMultipliesSubstracted = 1;
    //Count file spammity
    collectedProbs.forEach(prob => {
      probMultiplied *= prob;
      probMultipliesSubstracted *= 1 - prob;
    });
    let spamPrecent =
      (probMultiplied / (probMultiplied + probMultipliesSubstracted)) * 100;
    let spamText = "NOT SPAM";
    if (spamPrecent > neutralValue * 100) {
      spamText = "SPAM";
    }
    fileProbs.set(fileName, { precent: spamPrecent, text: spamText });
  }

  function benchmark(fileProbs) {
    let tp = 0;
    let fp = 0;
    let acc = 0;
    for (const [key, value] of fileProbs) {
      if (
        (key.includes("ne") && value.text == "NOT SPAM") ||
        (!key.includes("ne") && value.text == "SPAM")
      ) {
        tp++;
      } else {
        fp++;
      }
    }
    acc = (tp / (tp + fp)) * 100;
    return { tp: tp, fp: fp, acc: acc, size: fileProbs.size };
  }

  function kfcv() {
    function splitData(k, dirname) {
      const fs = require("fs");
      let filenames = fs.readdirSync(dirname);
      let amount = Math.floor(filenames.length / k);
      let folds = [];
      for (let i = 0; i < k; i++) {
        let fold = [];
        for (let j = 0; j < amount; j++) {
          fold[j] = {
            filename: filenames[amount * i + j],
            content: fs.readFileSync(
              dirname + filenames[amount * i + j],
              "utf-8"
            )
          };
        }
        folds[i] = fold;
      }
      return folds;
    }
    let folds = splitData(NSEGMENTS, validateDir);
    let cv = 0;
    for (let i = 0; i < folds.length; i++) {
      let reps = new Map();
      reps.spamCount = 0;
      reps.hamCount = 0;
      let trainData = folds.slice();
      let testData = trainData.splice(i, 1);
      trainData.forEach(arr =>
        arr.forEach(item => store(reps, item.content, item.filename))
      );
      let probs = new Map();
      calculateProbabilities(reps, probs);
      let fileProbs = new Map();
      testData[0].forEach(item =>
        classificateFile(fileProbs, probs, item.content, item.filename)
      );
      cv += benchmark(fileProbs).acc;
    }
    return cv / NSEGMENTS;
  }
}

function formResponse() {
  let settingNeutralValue = [0.35, 0.4, 0.5];
  let neutralValue = [0.3, 0.45, 0.6];
  let SEGcount = [8, 16, 20];
  let resCount = 0;
  let result = [];
  settingNeutralValue.forEach(value => {
    let tempMap = main(value, neutralValue[1], SEGcount[1], NSEGMENTS);
    result[resCount] = {
      countResult: {
        acc: tempMap.acc,
        kfc: tempMap.kfc,
        data: Array.from(tempMap.dataMap.entries())
      },
      params: {
        settingNeutralValue: value,
        neutralValue: neutralValue[1],
        SEGcount: SEGcount[1]
      }
    };
    resCount++;
    console.log("Iteration " + resCount + "/9");
  });
  neutralValue.forEach(value => {
    let tempMap = main(settingNeutralValue[1], value, SEGcount[1], NSEGMENTS);
    result[resCount] = {
      countResult: {
        acc: tempMap.acc,
        kfc: tempMap.kfc,
        data: Array.from(tempMap.dataMap.entries())
      },
      params: {
        settingNeutralValue: settingNeutralValue[1],
        neutralValue: value,
        SEGcount: SEGcount[1]
      }
    };
    resCount++;
    console.log("Iteration " + resCount + "/9");
  });
  SEGcount.forEach(value => {
    let tempMap = main(
      settingNeutralValue[1],
      neutralValue[1],
      value,
      NSEGMENTS
    );
    result[resCount] = {
      countResult: {
        acc: tempMap.acc,
        kfc: tempMap.kfc,
        data: Array.from(tempMap.dataMap.entries())
      },
      params: {
        settingNeutralValue: settingNeutralValue[1],
        neutralValue: neutralValue[1],
        SEGcount: value
      }
    };
    resCount++;
    console.log("Iteration " + resCount + "/9");
  });
  return result;
}

/*Server side*/
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
console.log("-----------SERVER STARTED-----------");
app.post("/api/world", (_, res) => {
  console.log("forming response");
  let response = formResponse();
  res.send(response);
  console.log("RESPONSE SENT.");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
