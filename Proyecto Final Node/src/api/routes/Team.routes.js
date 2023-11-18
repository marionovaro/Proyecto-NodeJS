const { upload } = require("../../middleware/files.middleware");
const {
  //! MAIN
  create,
  togglePlayer,
  getById,
  getAll,
  getByName,
  update,
  deleteTeam,
  sortTeamsbyLeagueandRanking,

  //! EXTRA
  sortTeamsbyDescending,
  sortTeamsbyAscending,
  filterGeneralNum,
  filterAndSort,
  averageStats,

  //! DESCARTADOS
  sortTeamsbyPoints,
  sortTeamsbyNetWorth,
  add90players,
} = require("../controllers/Team.controller");

const TeamRoutes = require("express").Router();

TeamRoutes.post("/", upload.single("image"), create);
TeamRoutes.patch("/add/:id", togglePlayer);
TeamRoutes.get("/:id", getById);
TeamRoutes.get("/", getAll);
TeamRoutes.get("/byName/:name", getByName);
TeamRoutes.patch("/:id", upload.single("image"), update);
TeamRoutes.delete("/:id", deleteTeam);

//! Controladores Extra
TeamRoutes.get("/sortdescending/teams/:stat", sortTeamsbyDescending);
TeamRoutes.get("/sortascending/teams/:stat", sortTeamsbyAscending);
TeamRoutes.get("/filter/teams/:filter/:gt/:lt", filterGeneralNum);
TeamRoutes.get("/filtersort/teams/:filter/:gt/:lt", filterAndSort);
TeamRoutes.get("/average/:stat/:teamId", averageStats);

//! Controladores Descartados
TeamRoutes.get("/sortbypoints/teams", sortTeamsbyPoints);
TeamRoutes.get("/sortbynetworth/teams", sortTeamsbyNetWorth);
TeamRoutes.patch("/players/:id/:players", add90players); //todo ---- REDIRECT
TeamRoutes.get("/sortranking/:league", sortTeamsbyLeagueandRanking);

module.exports = TeamRoutes;
