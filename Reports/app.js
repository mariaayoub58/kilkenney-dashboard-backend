const express = require("express");
const AWS = require("aws-sdk");
const http = require("http");
const cors = require("cors");
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
AWS.config.update({
  accessKeyId: //TODO Insert accessKeyId here,
  secretAccessKey: //TODO Insert secretAccessKey here,
  region: //TODO Insert region here,
});
const docClient = new AWS.DynamoDB.DocumentClient();

//For Local
const port = 3001;

app.post("/getTransactionDetails", async (req, res) => {
  try {
    const params = {
      TableName: "Transtable",
      KeyConditionExpression: "PK = :pk",
      FilterExpression:
        "Thing_Intangible_location = :location AND Thing_Intangible_Order_orderDate BETWEEN :startDate AND :endDate",
      ExpressionAttributeValues: {
        ":pk": "TRA#" + req.body["startDate"].slice(0, 7),
        ":location": req.body["location"],
        ":startDate": req.body["startDate"],
        ":endDate": req.body["endDate"],
      },
    };
    const result = await docClient.query(params).promise();
    const paramsYearlySales = {
      TableName: "Transtable",
      KeyConditionExpression: "PK = :pk1",
      ExpressionAttributeValues: {
        ":pk1": "TRA#" + req.body["startDate"].slice(0, 4),
      },
    };

    const yearlySalesResult = await docClient
      .query(paramsYearlySales)
      .promise();

    var yearlySales = {};
    for (let i = 0; i < yearlySalesResult["Items"].length; i++) {
      let transObject = yearlySalesResult["Items"][i];
      let month = parseInt(transObject.SK.slice(9, 11));
      if (yearlySales[month] == null || yearlySales[month] == undefined) {
        yearlySales[month] = 0;
      }
      yearlySales[month] =
        yearlySales[month] + transObject.Thing_Intangible_Offer_subtotal;
    }
    Object.keys(yearlySales).sort();
    let counter = 0;
    for (let i = 0; i < 12; i++) {
      counter = counter + 1;
      if (yearlySales[counter] == null) {
        yearlySales[counter] = 0;
      }
    }

    let totalYearlySales = Object.values(yearlySales);
    let transcount = 0,
      qtysold = 0,
      totalsales = 0,
      totalsales_ex = 0,
      atv = 0,
      atv1 = 0,
      atv2 = 0,
      totalprofit = 0,
      profitperday = 0;
    var date1 = new Date("2021-12-01");
    var date2 = new Date("2021-12-31"); //less than 1
    var start = Math.floor(date1.getTime() / (3600 * 24 * 1000)); //days as integer from..
    var end = Math.floor(date2.getTime() / (3600 * 24 * 1000)); //days as integer from..
    var daysDiff = end - start; // exact dates

    let customerSales = { Men: 0, Women: 0, Kids: 0 };
    let departmentSales = {
      Jewellery: 0,
      Sports: 0,
      Books: 0,
      Cosmetics: 0,
      Others: 0,
    };
    let yearName = [
      "Jan",
      "Feb",
      "Mar",
      "April",
      "May",
      "June",
      "July",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let customerName = ["Men", "Women", "Kids"];

    let departmentName = [
      "Jewellery",
      "Sports",
      "Books",
      "Cosmetics",
      "Others",
    ];
    var weeklyqtysold = {};
    var weeklytrans = {};
    var weeklypay = {};
    var weeklypro = {};
    var weeklyatv = {};
    var weeklymargin = {};
    for (let i = 0; i < result["Items"].length; i++) {
      let transaction = result["Items"][i];

      customerSales["Men"] =
        customerSales["Men"] + transaction.Customer_Sales["Men"];
      customerSales["Women"] =
        customerSales["Women"] + transaction.Customer_Sales["Women"];
      customerSales["Kids"] =
        customerSales["Kids"] + transaction.Customer_Sales["Kids"];

      departmentSales["Jewellery"] =
        departmentSales["Jewellery"] +
        transaction.Department_Sales["Jewellery"];
      departmentSales["Sports"] =
        departmentSales["Sports"] + transaction.Department_Sales["Sports"];
      departmentSales["Books"] =
        departmentSales["Books"] + transaction.Department_Sales["Books"];
      departmentSales["Cosmetics"] =
        departmentSales["Cosmetics"] +
        transaction.Department_Sales["Cosmetics"];
      departmentSales["Others"] =
        departmentSales["Others"] + transaction.Department_Sales["Others"];
      let date = transaction.SK.slice(4, 14);
      let potPK = "TRA#" + transaction.Thing_Intangible_Order_identifier.trim();

      const params = {
        TableName: "Transtable",
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": potPK,
        },
      };
      const potresult = await docClient.query(params).promise();
      for (let j = 0; j < potresult["Items"].length; j++) {
        let pot = potresult["Items"][j];
        totalprofit = totalprofit + pot.Thing_Intangible_Order_profit;
        weeklypro[date] = Math.round(pot.Thing_Intangible_Order_profit);
      }

      transcount = transcount + transaction.Thing_Intangible_Offer_subtotal;
      weeklytrans[date] = Math.round(
        transaction.Thing_Intangible_Offer_subtotal
      );
      qtysold = qtysold + transaction.Thing_Intangible_OrderItem_orderQuantity;
      weeklyqtysold[date] = Math.round(
        transaction.Thing_Intangible_OrderItem_orderQuantity
      );
      if (
        transaction.Thing_Intangible_StructuredValue_PriceSpecification_valueAddedTaxIncluded ==
        true
      ) {
        totalsales = totalsales + transaction.Thing_Intangible_Offer_subtotal;
        totalsales_ex =
          totalsales_ex +
          transaction.Thing_Intangible_Offer_subtotal -
          transaction.Thing_Intangible_Offer_taxAmount;
      } else {
        totalsales =
          totalsales +
          transaction.Thing_Intangible_Offer_subtotal +
          transaction.Thing_Intangible_Offer_taxAmount;
        totalsales_ex =
          totalsales_ex + transaction.Thing_Intangible_Offer_subtotal;
      }
      weeklypay[date] = Math.round(
        transaction.Thing_Intangible_Offer_subtotal +
          transaction.Thing_Intangible_Offer_taxAmount
      );
      atv = totalsales / transcount;
      weeklyatv[date] = Math.round(atv);
      atv1 = totalsales_ex / transcount;

      if (
        transaction.Thing_Intangible_StructuredValue_PriceSpecification_valueAddedTaxIncluded ==
        true
      ) {
        atv2 = atv2 + totalsales;
      } else {
        atv2 =
          atv2 + (totalsales + transaction.Thing_Intangible_Offer_taxAmount);
        atv2 = atv2 / transcount;
      }
      weeklymargin[date] = Math.round(atv2);
    }

    let transactiontotal = 0;
    transactiontotal = transcount / daysDiff; //transaction per day
    Totalqtysold = 0;
    Totalqtysold = qtysold / transcount;
    profitperday = totalprofit / daysDiff;

    res.status(200).send({
      Transactioncount: Math.round(transcount * 100) / 100,
      TransactionsperDay: transactiontotal,
      QtySold: qtysold,
      UnitsperTransaction: Totalqtysold,
      TotalSales: totalsales,
      ATV: Math.round((atv + Number.EPSILON) * 100) / 100,
      TotalSales_ex: totalsales_ex,
      ATV_ex: atv1,
      Profit: totalprofit,
      ProfitperDay: profitperday,
      CustomerSales: customerSales,
      DepartmentSales: departmentSales,
      YearName: yearName,
      WeeklyQtySold: weeklyqtysold,
      WeeklyTrans: weeklytrans,
      WeeklyPay: weeklypay,
      WeeklyPro: weeklypro,
      WeeklyAtv: weeklyatv,
      WeeklyMargin: weeklymargin,
      ProfitMargin: Math.round((atv2 + Number.EPSILON) * 100) / 100,
      YearlySalesResult: totalYearlySales,
    });
  } catch (error) {
    console.log(error);
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
