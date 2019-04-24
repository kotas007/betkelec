var stepped = 0,
  chunks = 0,
  rows = 0;
var start, end;
var parser;
var pauseChecked = false;
var printStepChecked = false;
var matchResults = null;

//published URL
var resultsURL = "https://predictapp.blob.core.windows.net/data/results.csv?1.0";
var predictionDataURL = "https://predictapp.blob.core.windows.net/data/predict.csv?1.0";

//local testing
//resultsURL = "http://192.168.1.7:8080/_data/results.csv?1.2";
//predictionDataURL = "http://192.168.1.7:8080/_data/predict.csv?1.1";

var totalPredictionParticipant = 7;

var matchStages = [
  //Kerala election stage & all gets completed in 1-stage.
  {
    //Till 20 consistency it is first stage.
    MatchNumber: 21,
    StageStartDate: 'Apr 23, 2019',
    StageEndDate: 'May 23, 2019',
    Stage: 1,
    ScoreAndWinnerPoints: 1,
    WinnerOnlyPoints: 3,
    LostPoints: 0
  }
];

var predictionKeyValue = {
  ConstituencyId: 0,
  ConstituencyName: 1,
  ParticipantName: 2,
  WinnerPredict: 3,
  WinnerMarginPredict: 4

}

var leaderboardCatalog = [];
var keyOptions = [
  "Participant", //0
  "Total points", //1
  "Total score predict matches", //2
  "Total winner predict matches", //3
  "Total predict lost matches", //4
  "Total number of matches" //5
];

$.fn.exists = function () {
  return this.length !== 0;
}


function completeResultsFn(results) {
  if (results && results.errors) {
    if (results.errors) {
      errorCount = results.errors.length;
      firstError = results.errors[0];
    }
    if (results.data && results.data.length > 0) {
      rowCount = results.data.length;
      matchResults = results.data;
    }
  }

  console.log("    Results paring complete", results);
}

function completePredictFn(results) {
  if (results && results.errors) {
    if (results.errors) {
      errorCount = results.errors.length;
      firstError = results.errors[0];
    }
    if (results.data && results.data.length > 0)
      rowCount = results.data.length;
  }

  console.log("    Prediction parsing starting:", results);
  if (!matchResults) {
    console.log("    Match Results not loaded!");
    return;
  }

  var leaderboard = {};
  var leaderboardPredictScorePlusWinnerGameCount = {};
  var leaderboardPredictWinnerGameCount = {};
  var leaderboardPredictLossesGameCount = {};
  var leaderboardPredictMatchesScorePlusWinner = {};
  var leaderboardPredictMatchesWinner = {};
  var leaderboardPredictMatchesLost = {};

  var activeStageMatchNumber = 1;
  for (var i = 0; i < matchStages.length; i++) {
    var dDiff = Date.parse(matchStages[i].StageEndDate) - new Date()
    var diffDays = Math.ceil(dDiff / (1000 * 3600 * 24));
    if (diffDays >= 0) {
      activeStageMatchNumber = matchStages[i].MatchNumber;
      break;
    }
  }

  //all match prediction table
  var tbl = document.createElement('table');
  tbl.setAttribute('class', 'table table-condensed');
  tbl.setAttribute('id', 'breakupdetail');

  var thead = document.createElement('thead');
  var tbdy = document.createElement('tbody');

  //upcoming match prediction table
  var upcomingTbl = document.createElement('table');
  upcomingTbl.setAttribute('class', 'table table-condensed');
  upcomingTbl.setAttribute('id', 'upcomingdetail');
  var upcomingTbdy = document.createElement('tbody');

  var lastMatchNo = 0;
  var newMatch = false;
  var isUpcoming = false;
  var newMarginWinner= {
    Participant: [],
    Diff: null,
    CurrPoint: [],
    Element: []
  };
  var winnerName = null;
  var winnerMargin = null;

  for (var i = 0; i < results.data.length; i++) {
    var row = results.data[i];
    
    //table headers 
    if (i == 0) {
      var theadrow = document.createElement('tr');

      //add match number
      var theadth = document.createElement('th');
      theadth.textContent = row[0];
      //theadrow.appendChild(theadth);

      //add constituency
      theadth = document.createElement('th');
      theadth.textContent = "Constituency";
      theadrow.appendChild(theadth);

      //add name
      theadth = document.createElement('th');
      theadth.textContent = "Participant";
      theadrow.appendChild(theadth);

      //add prediction
      theadth = document.createElement('th');
      theadth.textContent = "Predict [Margin]";
      theadrow.appendChild(theadth);

      //add prediction
      theadth = document.createElement('th');
      theadth.textContent = "Points";
      theadrow.appendChild(theadth);


      //set header row in the table
      thead.appendChild(theadrow);
    } else {
      //i=0 skipped because xls will have the first row with header

      // //to check if all participants have entered.
      // if (row.length != totalPredictionParticipant) {
      //   continue;
      // }

      var currentMatchNo = row[predictionKeyValue.ConstituencyId];
      if ( currentMatchNo == null) continue;
      if (lastMatchNo != currentMatchNo) {
        newMatch = true;
        isUpcoming = false;

        //while looping through & when constituency changes
        //check for the winner
        var curNewMarginWinnerParticipant = null;
        while ( curNewMarginWinnerParticipant = newMarginWinner.Participant.pop() ) {
          leaderboardPredictScorePlusWinnerGameCount[curNewMarginWinnerParticipant] += matchStages[currentMatchStage].ScoreAndWinnerPoints;
          leaderboard[curNewMarginWinnerParticipant] += matchStages[currentMatchStage].ScoreAndWinnerPoints;
          newMarginWinner.Element.pop().innerHTML = '<i class="fas fa-angle-double-up" style="color:#32CD32;"></i>' 
            + Math.abs(matchStages[currentMatchStage].ScoreAndWinnerPoints+newMarginWinner.CurrPoint.pop());
        }

        //reset for every constituency
        newMarginWinner = {
          Participant: [],
          Diff: null,
          CurrPoint: [],
          Element: []
        };
        winnerName = null;
        winnerMargin = null;
      } else {
        newMatch = false;
      }
      lastMatchNo = currentMatchNo;

      var currentMatchStage = matchStages.length - 1;
      for (var x = 0; x < matchStages.length; x++) {
        if (currentMatchNo < matchStages[x].MatchNumber) {
          currentMatchStage = matchStages[x].Stage - 1;
          break;
        }
      }

      //name
      var participantName = "";
      if ( row[predictionKeyValue.ParticipantName] ) {
        participantName = row[predictionKeyValue.ParticipantName].trim();
      }
      if (!"".localeCompare(participantName)) {
        continue;
      }

      //table rows
      var tbdytr = document.createElement('tr');

      //add match#
      var tbdytdName = null;
      if (newMatch) {
        //actual result
        var resultString = "";
        var matchResult = matchResults[currentMatchNo];

        var resultConstituency = matchResult[1];
        var resultStatus = matchResult[2];
        winnerName = matchResult[3];
        winnerMargin = matchResult[4];
      
        var matchComplete = false;
        if (!"Complete".localeCompare(resultStatus)) {
          resultString = "<b>" + winnerName + "[" +  winnerMargin + "]</b> ";
          matchComplete = true;
        } else {
          resultString = resultConstituency + " results on " + resultStatus;
          var matchDateDiff = Math.abs(Date.parse(resultStatus.trim()) - new Date());
          var diffDays = Math.ceil(matchDateDiff / (1000 * 3600 * 24));
          if (diffDays <= 32) {
            isUpcoming = true;
          }
        }
        tbdytdName = document.createElement('td');
        tbdytdName.innerHTML = resultString;
        tbdytdName.setAttribute('rowspan', totalPredictionParticipant);
        tbdytr.appendChild(tbdytdName);
      }

      var avatarInline = "<img src='./img/" + participantName + ".png' width='20' />" +
        participantName;

      tbdytdName = document.createElement('td');
      tbdytdName.innerHTML = avatarInline;
      tbdytr.appendChild(tbdytdName);

      //predict
      var predictWinnerName = row[3];
      var predictWinnerMargin = row[4];

      var predictString = predictWinnerName + " [" + predictWinnerMargin + "]";

      //points
      var predictPoints = matchStages[currentMatchStage].LostPoints;
      if (winnerName == predictWinnerName) {
        predictPoints = matchStages[currentMatchStage].WinnerOnlyPoints;
        predictString = "<b>" + predictWinnerName + " [" + predictWinnerMargin + "]</b>";
      }

      tbdytdName = document.createElement('td');
      tbdytdName.innerHTML = predictString;
      tbdytr.appendChild(tbdytdName);

      tbdytdName = document.createElement('td');
      if (matchComplete) {
        if (!(participantName in leaderboard)) {
          leaderboard[participantName] = 0;
          leaderboardPredictScorePlusWinnerGameCount[participantName] = 0;
          leaderboardPredictWinnerGameCount[participantName] = 0;
          leaderboardPredictLossesGameCount[participantName] = 0;
          leaderboardPredictMatchesScorePlusWinner[participantName] = [];
          leaderboardPredictMatchesWinner[participantName] = [];
          leaderboardPredictMatchesLost[participantName] = [];
        }

        leaderboard[participantName] += predictPoints;
        leaderboardPredictMatchesWinner[participantName].push(predictString);

        if (predictPoints >= matchStages[currentMatchStage].WinnerOnlyPoints) {
          leaderboardPredictWinnerGameCount[participantName] += 1;
          tbdytdName.innerHTML = '<i class="fas fa-angle-up" style="color:#32CD32;"></i>' + Math.abs(predictPoints);

          var predictDiff = Math.abs(predictWinnerMargin-winnerMargin);

          //store the prediction winner who has lowest difference across other participant details
          if ( (newMarginWinner.Participant.length == 0) || (predictDiff <= newMarginWinner.Diff)) {
            if ( predictDiff < newMarginWinner.Diff ) {
              //new lower score
              newMarginWinner.Diff = predictDiff;

              //clear old
              newMarginWinner.Participant = [];              
              newMarginWinner.CurrPoint = [];
              newMarginWinner.Element = [];

              //set new participant
              newMarginWinner.Participant.push(participantName);              
              newMarginWinner.CurrPoint.push(predictPoints);
              newMarginWinner.Element.push(tbdytdName);
            } else {
              //same score
              newMarginWinner.Diff = predictDiff;
              newMarginWinner.Participant.push(participantName);
              newMarginWinner.CurrPoint.push(predictPoints);
              newMarginWinner.Element.push(tbdytdName);
            }
          }
        }

        if (predictPoints == matchStages[currentMatchStage].LostPoints) {
          leaderboardPredictLossesGameCount[participantName] += 1;
          tbdytdName.innerHTML = '<i class="fas fa-angle-down" style="color:#DC143C;"></i>' + Math.abs(predictPoints);
        }

        updateLeaderBoardCatalog(currentMatchNo, participantName, predictPoints, currentMatchStage);
      } else {
        //tbdytdName.textContent = "-";
        tbdytdName.innerHTML = '<i class="fas fa-ellipsis-h" style="color:#797D7F;"></i>';
      }

      if (isUpcoming) {
        upcomingTbdy.appendChild(tbdytr.cloneNode(true));
      }

      tbdytr.appendChild(tbdytdName);

      //append the row if there are predictions
      if ( ("".localeCompare(predictWinnerName.trim()) != 0) && ("".localeCompare(predictWinnerMargin.trim()) !=0) )
      {
        tbdy.appendChild(tbdytr);
      }

      location.hash = "features";
    }
  }

  //after looping the last line, if there isn't a new line at the EOF
  //check for the winner
  {
    var curNewMarginWinnerParticipant = null;
    while ( curNewMarginWinnerParticipant = newMarginWinner.Participant.pop() ) {
    leaderboardPredictScorePlusWinnerGameCount[curNewMarginWinnerParticipant] += matchStages[currentMatchStage].ScoreAndWinnerPoints;
    leaderboard[curNewMarginWinnerParticipant] += matchStages[currentMatchStage].ScoreAndWinnerPoints;
    newMarginWinner.Element.pop().innerHTML = '<i class="fas fa-angle-double-up" style="color:#32CD32;"></i>' 
      + Math.abs(matchStages[currentMatchStage].ScoreAndWinnerPoints+newMarginWinner.CurrPoint.pop());
    }
  }

  tbl.appendChild(thead);
  if (tbdy.childElementCount == 0) {
    var tbdytr = document.createElement('tr');
    var tbdytdName = document.createElement('td');
    tbdytdName.textContent = "Predictions are pending. Wait for particpants to submit the predictions.";
    tbdytdName.setAttribute('colspan', thead.children[0].children.length);
    tbdytr.appendChild(tbdytdName);
    tbl.appendChild(tbdytr);
  }
  tbl.appendChild(tbdy);

  var upcomingTblHead = thead.cloneNode(true);
  upcomingTblHead.firstElementChild.removeChild(upcomingTblHead.firstElementChild.lastElementChild);
  
  if (upcomingTbdy.childElementCount == 0) {
    var tbdytr = document.createElement('tr');
    var tbdytdName = document.createElement('td');
    tbdytdName.textContent = "Predictions are pending. Wait for particpants to submit the predictions.";
    tbdytdName.setAttribute('colspan', thead.children[0].children.length);
    tbdytr.appendChild(tbdytdName);
    upcomingTbdy.appendChild(tbdytr);
  }
  upcomingTbl.appendChild(upcomingTblHead);
  upcomingTbl.appendChild(upcomingTbdy);

  var sortedLeaderboard = Object.keys(leaderboard) //Create a list from the keys of your map. 
    .sort( //Sort it ...
      function (a, b) { // using a custom sort function that...
        // compares (the keys) by their respective values.
        return leaderboard[b] - leaderboard[a];
      })
  // console.log("Sorted leaders: " + sortedLeaderboard);

  if ($("#featuredetail").exists()) {
    $("#featuredetail").remove();
  }

  if ($("#upcomingdetail").exists()) {
    $("#upcomingdetail").remove();
  }

  if ($("#breakupdetail").exists()) {
    $("#breakupdetail").remove();
  }

  if ($("#leaderboard").exists()) {
    $("#leaderboard").remove();
  }

  if ($("#leaderboarddetail").exists()) {
    $("#leaderboarddetail").remove();
  }

  if ( sortedLeaderboard.length != 0 ) {
    $("#featuredetails").append(createLeaderBoard1(leaderboard,
      leaderboardPredictScorePlusWinnerGameCount,
      leaderboardPredictWinnerGameCount,
      leaderboardPredictLossesGameCount,
      leaderboardPredictMatchesScorePlusWinner,
      leaderboardPredictMatchesWinner,
      leaderboardPredictMatchesLost,
      sortedLeaderboard));      
  } else if ($("#featuredetails").exists()) {
    $("#featuredetails").remove();
  }

  if (upcomingTbdy.childElementCount == 0) {
    $("#upcomingdetails").append(upcomingTbl);
  } else if ($("#upcomingdetails").exists()) {
    $("#upcomingdetails").remove();
  }

  if ( sortedLeaderboard.length != 0 ) {
    $("#leaderboarddetails").append(createLeaderBoard2(leaderboard,
      leaderboardPredictScorePlusWinnerGameCount,
      leaderboardPredictWinnerGameCount,
      leaderboardPredictLossesGameCount,
      leaderboardPredictMatchesScorePlusWinner,
      leaderboardPredictMatchesWinner,
      leaderboardPredictMatchesLost,
      sortedLeaderboard));
  } else if ($("#leaderboarddetails").exists()) {
    $("#leaderboarddetails").remove();
  }

  $("#breakupdetails").append(tbl); 

  enableButton();

  console.log("    Prediction paring complete", results);
}

function createLeaderBoard1(leaderboard,
  leaderboardPredictScorePlusWinnerGameCount,
  leaderboardPredictWinnerGameCount,
  leaderboardPredictLossesGameCount,
  leaderboardPredictMatchesScorePlusWinner,
  leaderboardPredictMatchesWinner,
  leaderboardPredictMatchesLost,
  sortedLeaderboard) {  
  var leaderTbl = document.createElement('table');

  leaderTbl.setAttribute('class', 'table table-condensed');
  leaderTbl.setAttribute('id', 'leaderboard');

  var tLhead = document.createElement('thead');

  var thRow = document.createElement('tr');

  var thHead1 = document.createElement('th');
  thHead1.textContent = "Name";
  thHead1.setAttribute('colspan', '2');

  var thHead2 = document.createElement('th');
  thHead2.textContent = "Total Points";

  thRow.appendChild(thHead1);
  thRow.appendChild(thHead2);
  tLhead.appendChild(thRow);
  leaderTbl.appendChild(tLhead);

  var tLbdy = document.createElement('tbody');
  //loop through header row elements
  for (var j = 0; j < sortedLeaderboard.length; j++) {
    var pName = sortedLeaderboard[j];

    var trow = document.createElement('tr');

    //add match number
    var thead1 = document.createElement('th');
    var avatar = document.createElement("img");
    avatar.src = "./img/" + pName + ".png";
    avatar.width = "50";

    //add avatar
    thead1.appendChild(avatar);

    var thead2 = document.createElement('th');
    thead2.textContent = pName;
    thead2.style.textAlign = "left";

    var tpoint1 = document.createElement('td');
    tpoint1.innerHTML = leaderboard[pName] +
      "<div style=\"font-size: 0.8em\">(Predicted Winner + Margin: " +
      leaderboardPredictScorePlusWinnerGameCount[pName] +
      ", Predicted Winner: " +
      leaderboardPredictWinnerGameCount[pName] +
      ", Prediction Failed: " +
      leaderboardPredictLossesGameCount[pName] +
      ")</div>";

    //add leader row
    trow.appendChild(thead1);
    trow.appendChild(thead2);
    trow.appendChild(tpoint1);
    tLbdy.appendChild(trow);
  }

  leaderTbl.appendChild(tLbdy);

  // $("#featuredetails").append(leaderTbl);

  return leaderTbl;
}

function createLeaderBoard2(leaderboard,
  leaderboardPredictScorePlusWinnerGameCount,
  leaderboardPredictWinnerGameCount,
  leaderboardPredictLossesGameCount,
  leaderboardPredictMatchesScorePlusWinner,
  leaderboardPredictMatchesWinner,
  leaderboardPredictMatchesLost,
  sortedLeaderboard) {  
  if (sortedLeaderboard.length == 0 ) return;
  var leaderTbl = document.createElement('table');

  leaderTbl.setAttribute('class', 'table table-condensed');
  leaderTbl.setAttribute('id', 'leaderboarddetail');

  var tLhead = document.createElement('thead');

  var thRow = document.createElement('tr');

  var thHead1 = document.createElement('th');
  thHead1.textContent = "Name";
  thHead1.setAttribute('colspan', '2');

  var thHead3 = document.createElement('th');
  thHead3.textContent = "Successful vote margin prediction";

  var thHead4 = document.createElement('th');
  thHead4.textContent = "Successful prediction of winner";

  var thHead5 = document.createElement('th');
  thHead5.textContent = "Lost prediction of winner";

  thRow.appendChild(thHead1);
  thRow.appendChild(thHead3);
  thRow.appendChild(thHead4);
  thRow.appendChild(thHead5);
  tLhead.appendChild(thRow);
  leaderTbl.appendChild(tLhead);

  var tLbdy = document.createElement('tbody');
  //loop through header row elements
  for (var j = 0; j < sortedLeaderboard.length; j++) {
    var pName = sortedLeaderboard[j];

    var trow = document.createElement('tr');

    //add match number
    var thead1 = document.createElement('th');
    var avatar = document.createElement("img");
    avatar.src = "./img/" + pName + ".png";
    avatar.width = "50";

    //add avatar
    thead1.appendChild(avatar);

    var thead2 = document.createElement('th');
    thead2.textContent = pName;
    thead2.style.textAlign = "left";

    var tpoint2 = document.createElement('td');
    tpoint2.innerHTML = leaderboardPredictScorePlusWinnerGameCount[pName];
    // tpoint2.innerHTML += "<br/><div style=\"font-size: 0.8em\">" +
    //   leaderboardPredictMatchesScorePlusWinner[pName].sort().join("<br/>") +
    //   "</div>";


    var tpoint3 = document.createElement('td');
    tpoint3.innerHTML = leaderboardPredictWinnerGameCount[pName];
    // tpoint3.innerHTML += "<div style=\"font-size: 0.8em\">" +
    //   leaderboardPredictMatchesWinner[pName].sort().join("<br/>") +
    //   "</div>";

    var tpoint4 = document.createElement('td');
    tpoint4.innerHTML = leaderboardPredictLossesGameCount[pName];
    // tpoint4.innerHTML += "<div style=\"font-size: 0.8em\">" +
    //   leaderboardPredictMatchesLost[pName].sort().join("<br/>") +
    //   "</div>";

    //add leader row
    trow.appendChild(thead1);
    trow.appendChild(thead2);

    trow.appendChild(tpoint2);
    trow.appendChild(tpoint3);
    trow.appendChild(tpoint4);

    tLbdy.appendChild(trow);
  }

  leaderTbl.appendChild(tLbdy);

  return leaderTbl;
}

function checkAndInitialize(pName) {
  var pFound = false;
  //find participantName in the array
  for (var i = 0; i < leaderboardCatalog.length; i++) {
    var leaderBoardItem = leaderboardCatalog[i];
    if (leaderBoardItem[keyOptions[0]] == pName) {
      pFound = true;
      break;
    }
  }

  if (pFound == false) {
    var pKeyName = keyOptions[0];
    var leaderBoardItem = {};
    leaderBoardItem[pKeyName] = pName;
    for (var k = 1; k < keyOptions.length; k++) {
      leaderBoardItem[keyOptions[k]] = 0;
    }
    leaderboardCatalog.push(leaderBoardItem);
  }
}

function updateLeaderBoardCatalog(currentMatchNo, participantName, predictPoints, currentMatchStage) {

  checkAndInitialize(participantName);

  //find participantName in the array
  for (var i = 0; i < leaderboardCatalog.length; i++) {
    if (leaderboardCatalog[i][keyOptions[0]] == participantName) {
      var leaderBoardItem = leaderboardCatalog[i];
      leaderBoardItem[keyOptions[1]] += predictPoints;

      //keyOption[last] ==> total number of matches
      leaderBoardItem[keyOptions[matchStages.length-1]] += 1;

      //keyOption[2] ==> "Total score predict matches"
      if (predictPoints == matchStages[currentMatchStage].ScoreAndWinnerPoints) {
        leaderBoardItem[keyOptions[2]] += 1;
      }

      //keyOption[3] ==> "Total winner predict matches"
      if (predictPoints >= matchStages[currentMatchStage].WinnerOnlyPoints) {
        leaderBoardItem[keyOptions[3]] += 1;
      }

      //keyOption[4] ==> "Total predict lost matches"
      if (predictPoints == matchStages[currentMatchStage].LostPoints) {
        leaderBoardItem[keyOptions[4]] += 1;
      }
    }
  }
}


function buildPredictConfig() {
  return {
    delimiter: $('#delimiter').val(),
    newline: getLineEnding(),
    header: $('#header').prop('checked'),
    dynamicTyping: $('#dynamicTyping').prop('checked'),
    preview: parseInt($('#preview').val() || 0),
    step: $('#stream').prop('checked') ? stepFn : undefined,
    encoding: $('#encoding').val(),
    worker: $('#worker').prop('checked'),
    comments: $('#comments').val(),
    complete: completePredictFn,
    error: errorFn,
    download: true,
    fastMode: $('#fastmode').prop('checked'),
    skipEmptyLines: $('#skipEmptyLines').prop('checked'),
    chunk: $('#chunk').prop('checked') ? chunkFn : undefined,
    beforeFirstChunk: undefined,
  };
}

//invoked when you click the button
$(function () {
  $('#features').ready(function () {
    $('#features').css('display', 'none');
  });

  $('#submit').click(function () {
    stepped = 0;
    chunks = 0;
    rows = 0;
    matchResults = null;

    disableButton();

    //parse results file
    var rConfig = buildResultsConfig();
    Papa.parse(
      resultsURL,
      rConfig);
    if (rConfig.worker || rConfig.download)
      console.log("Results parsing running...");

    //parse prediction file
    var pConfig = buildPredictConfig();
    Papa.parse(
       predictionDataURL,
       pConfig);
    
       if (pConfig.worker || pConfig.download)
       console.log("Prediction parsing running...");
    
  });
});

function buildResultsConfig() {
  return {
    delimiter: $('#delimiter').val(),
    newline: getLineEnding(),
    header: $('#header').prop('checked'),
    dynamicTyping: $('#dynamicTyping').prop('checked'),
    preview: parseInt($('#preview').val() || 0),
    step: $('#stream').prop('checked') ? stepFn : undefined,
    encoding: $('#encoding').val(),
    worker: $('#worker').prop('checked'),
    comments: $('#comments').val(),
    complete: completeResultsFn,
    error: errorFn,
    download: true,
    fastMode: $('#fastmode').prop('checked'),
    skipEmptyLines: $('#skipEmptyLines').prop('checked'),
    chunk: $('#chunk').prop('checked') ? chunkFn : undefined,
    beforeFirstChunk: undefined,
  };
}

function getLineEnding() {
  if ($('#newline-n').is(':checked'))
    return "\n";
  else if ($('#newline-r').is(':checked'))
    return "\r";
  else if ($('#newline-rn').is(':checked'))
    return "\r\n";
  else
    return "";
}

function enableButton() {
  $('#submit').prop('disabled', false);
  $('#submit').prop('text', "WHO IS THE TOPPER");
}

function disableButton() {
  $('#submit').prop('disabled', true);
  $('#submit').prop('text', "Wait processing predictions...");
  $('#features').css('display', 'block');
}

function errorFn(err, file) {
  console.log("ERROR:", err, file);
}