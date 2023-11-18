//! --------------- ENUM GENDER ------------------
const enumGenderOk = (gender) => {
  const enumGender = ["hombre", "mujer", "otros"];
  if (enumGender.includes(gender)) {
    console.log("entro en el true");
    return { check: true, gender };
  } else {
    return {
      chceck: false,
    };
  }
};

//! --------------- ENUM POSITION ------------------
const enumPositionOk = (position) => {
  const enumPosition = [
    "goalkeeper",
    "centre-back",
    "right-back",
    "left-back",
    "midfielder",
    "forward",
  ];
  if (enumPosition.includes(position)) {
    console.log("entro en el true");
    return { check: true, position };
  } else {
    return {
      check: false,
    };
  }
};

//! --------------- ENUM PREFERRED FOOT ------------------
const enumPreferredFootOk = (foot) => {
  const enumPreferredFoot = ["right", "left"];
  if (enumPreferredFoot.includes(foot)) {
    console.log("entro en el true");
    return { check: true, foot };
  } else {
    return {
      check: false,
    };
  }
};

//! --------------- ENUM LEAGUE ------------------
const enumLeagueOk = (league) => {
  const enumLeague = ["Premier", "LaLiga", "Serie A", "Bundesliga", "Ligue 1"];
  if (enumLeague.includes(league)) {
    console.log("entro en el true");
    return { check: true, league };
  } else {
    return {
      check: false,
    };
  }
};

module.exports = {
  enumGenderOk,
  enumPositionOk,
  enumPreferredFootOk,
  enumLeagueOk,
};
