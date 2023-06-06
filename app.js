const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObjectDistrict = (dbObjectDistrict) => {
  return {
    districtId: dbObjectDistrict.district_id,
    districtName: dbObjectDistrict.district_name,
    stateId: dbObjectDistrict.state - id,
    cases: dbObjectDistrict.cases,
    cured: dbObjectDistrict.cured,
    active: dbObjectDistrict.active,
    deaths: dbObjectDistrict.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
    *
    FROM
    state;`;

  const allStates = await db.all(getStatesQuery);
  response.send(
    allStates.map((eachObject) => convertDbObjectToResponseObject(eachObject))
  );
});

app.get("/states/stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
      *
    FROM
      state
    WHERE
      state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertDbObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
    INSERT INTO
      district (district_name, state_id, cases, cured, active, deaths)
    VALUES
      (
        '${districtName}',
         ${stateId},
         ${cases},
         ${cured},
         ${active},
         ${deaths}
      );`;
  const dbResponse = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
      district_id As districtId,
      district_name As districtName,
      state_id As stateId,
      cases,
      cured, 
      active,
      deaths
    FROM
      district
    WHERE
      district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const DeleteDistrictQuery = `
     DELETE
     FROM
     district
     WHERE 
     district_id = ${districtId};`;
  await db.run(DeleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
    UPDATE
      district
    SET
       district_name =  '${districtName}',
       state_id = ${stateId},
       cases = ${cases},
       cured = ${cured},
       active = ${active},
       deaths = ${deaths}
    WHERE
      district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id = ${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
SELECT
state_id
FROM
district
WHERE 
district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
SELECT
state_name
as stateName
FROM
state
WHERE
state_id = ${getDistrictIdQueryResponse.state_id};
`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
