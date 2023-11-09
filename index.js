const express = require("express");
const { Sequelize, Op, DataTypes } = require("sequelize");
const { parseFile, writeToPath } = require("fast-csv");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
});

const Config = sequelize.define("config", {
  userId: { type: DataTypes.STRING },
  link: { type: DataTypes.STRING, allowNull: false },
});

sequelize.sync();

const app = express();

const port = 3000;

app.use(express.json());

app.get("/configs", async (req, res) => {
  const { userId } = req.query;
  const config = await Config.findOne({ where: { userId } });
  if (config) return res.send(config.dataValues.link);
  const newConfig = await Config.findOne({
    where: { userId: { [Op.ne]: null } },
  });
  if (newConfig) {
    await Config.update({ userId }, { where: { id: newConfig.dataValues.id } });
    return res.send(newConfig.dataValues.link);
  }
  res.status(404).send("No more configs are available");
});

app.get("/configs/export", async (req, res) => {
  const configs = await Config.findAll();
  const rows = [["userId", "link"]];
  for (const config of configs)
    rows.push([config.dataValues.userId, config.dataValues.link]);
  writeToPath("./configs.csv", rows);
  res.send("exported into configs.csv");
});

app.get("/configs/import", async (req, res) => {
  const rows = [];
  parseFile("./configs.csv")
    .on("error", (error) => res.status(500).send("something went wrong"))
    .on("data", (row) => rows.push(row))
    .on("end", async (rowCount) => {
      await Config.destroy({ truncate: true });
      for (let i = 1; i < rows.length; i++) {
        console.log(rows[i]);
        await Config.create({ userId: rows[i][0], link: rows[i][1] });
      }
      res.send("imported from configs.csv");
    });
});

app.listen(port, () => {
  console.log(`app is listening on port ${port}`);
});
