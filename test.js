const csv = require("fast-csv");
const arr = [];

csv
  .parseFile("./test.csv")
  .on("error", (error) => console.error(error))
  .on("data", (row) => {
    arr.push(row);
    console.log(row);
  })
  .on("end", (rowCount) => {
    console.log(`Parsed ${rowCount} rows`);
    csv.writeToPath("./newone.csv", arr);
  });
