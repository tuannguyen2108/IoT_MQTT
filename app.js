function setGaugeValue(gauge, value, percent) {
  percent.innerText = `${value * 100}` + "%";
  if (value < 0 || value > 1) {
    return;
  }
  gauge.querySelector(".gauge__fill").style.transform = `rotate(${
    value / 2
  }turn)`;
}
function setGaugeValueHum(value) {
  const gauge = document.querySelector(".gaugeHum");
  const percent = document.getElementById("humidityValue");
  setGaugeValue(gauge, value, percent);
}

function setGaugeValueTemp(value) {
  const gauge = document.querySelector(".gaugeTemp");
  const percent = document.getElementById("temperatureValue");
  setGaugeValue(gauge, value, percent);
}

function setGaugeValueSoil(value) {
  const gauge = document.querySelector(".gaugeSoil");
  const percent = document.getElementById("soilValue");
  // const titleHumidity = document.querySelector(".title_humidity");
  // percent.innerText = `${value * 100}` + "%";
  setGaugeValue(gauge, value, percent);
}

function getThresholdSoilValue(value) {
  const towBar = document.getElementById("progress");
  towBar.value = `${value}`;
}

// Lấy thẻ input range
var rangeInput = document.getElementById("progress");

// Thêm sự kiện 'input' để theo dõi sự thay đổi giá trị
rangeInput.addEventListener("input", function () {
  // Lấy giá trị mới từ thanh trượt
  var newValue = rangeInput.value;

  // In giá trị mới ra console
  console.log("Giá trị mới: " + newValue);
  pullBar(newValue);
});

//GET STATUS
function getTitle(idElement, string, name) {
  const status = idElement.querySelector(".title-item");
  status.innerHTML = `<h2 class = "title">${name} ${string}`;
}

// function getSoilStatus(string) {
//   const idElement = document.getElementById("soil-status");
//   var name = "NGƯỠNG ĐỘ ẨM ĐẤT:";
//   getTitle(idElement, string, name);
// }

function getLightStatus(string) {
  const idElement = document.getElementById("light-status");
  var name = "TRỜI:";
  getTitle(idElement, string, name);
}

function getRainStatus(string) {
  const idElement = document.getElementById("rain-status");
  var name = "";
  getTitle(idElement, string, name);
}

function getModeStatus(string) {
  const idElement = document.getElementById("mode");
  var name = "TỰ ĐỘNG:";
  getTitle(idElement, string, name);
}
function getBulbStatus(string) {
  const idElement = document.getElementById("bulb");
  var name = "ĐÈN:";
  getTitle(idElement, string, name);
}
function getPumpStatus(string) {
  const idElement = document.getElementById("pump");
  var name = "MÁY BƠM:";
  getTitle(idElement, string, name);
}
function getCurtainStatus(string) {
  const idElement = document.getElementById("curtain");
  var name = "RÈM:";
  getTitle(idElement, string, name);
}

// ================= MQTT ===================
// PRIVATE BROKER
// var client = mqtt.connect("wss://smartgarden.cloud.shiftr.io", {
//   username: "smartgarden",
//   password: "Qhso0aAn9XUrGkYN",
// });
// PUBLISH BROKER
var client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");
// var deviceName = "MyESP32Device";

client.on("connect", function () {
  console.log("Connected to shiftr.io broker");
  client.subscribe("esp32/temp");
});

client.on("message", function (topic, message) {
  var data = JSON.parse(message.toString());
  // console.log("Received message:", data);
  var humValue = parseFloat(data.Humidity) / 100;
  var tempValue = parseFloat(data.Temperature) / 100;
  var soilValue = parseFloat(data.Soil_Humidity) / 100;
  var thresholdSoilValue = parseFloat(data.Ref_Value);
  var lightStatus = data.Light_Status;
  var rainStatus = data.Rain_Status;
  var modeStatus = data.Mode_Status;
  var bulbStatus = data.Bulb_Status; // Đã sửa từ "bulbStatus" thành "bulbStatus"
  var pumpStatus = data.Pump_Status;
  var curtainStatus = data.Curtain_Status;
  // console.log(bulbStatus);
  //GAUGE
  setGaugeValueHum(humValue);
  setGaugeValueTemp(tempValue);
  setGaugeValueSoil(soilValue);
  //THRESHOLD
  getThresholdSoilValue(thresholdSoilValue);
  //STATUS
  getLightStatus(lightStatus);
  getRainStatus(rainStatus);
  getModeStatus(modeStatus);
  getBulbStatus(bulbStatus); // Đã sửa từ "getBulbStatus(bulbStatus)" thành "getBulbStatus(bulbStatus)"
  getPumpStatus(pumpStatus);
  getCurtainStatus(curtainStatus);
  // getSoilStatus(soilValue);
  //change image status
  var xImg = document.getElementById("rain-img-non");
  var rainBlock = document.getElementById("rain-status");
  if (rainStatus == "MƯA") {
    rainBlock.style.backgroundColor = "#E0F4FF";
    xImg.style.display = "none";
  } else {
    rainBlock.style.backgroundColor = "#ffffff";
    xImg.style.display = "block";
  }

  var lightBlock = document.getElementById("light-status");
  var lightImg = document.getElementById("light-img");
  if (lightStatus == "TỐI") {
    lightBlock.style.backgroundColor = "#27536b";
    lightImg.src = "img/moon-icon.png";
  } else {
    lightBlock.style.backgroundColor = "#FFF6E0";
    lightImg.src = "img/sun-icon.png";
  }

  var modeButton = document.getElementById("mode");
  var pumpButton = document.getElementById("pump");
  var buldButton = document.getElementById("bulb");
  var curtainButton = document.getElementById("curtain");

  function toggleButton(button, status, string) {
    if (status == `${string}`) {
      button.style.backgroundColor = "#D8D9DA";
    } else {
      button.style.backgroundColor = "rgb(14, 192, 216)";
    }
  }
  toggleButton(modeButton, modeStatus, "TẮT");
  toggleButton(pumpButton, pumpStatus, "TẮT");
  toggleButton(buldButton, bulbStatus, "TẮT");
  toggleButton(curtainButton, curtainStatus, "THU");

  // get value for threshold Soil title
  var soilValue = document.getElementById("soil-value");
  soilValue.innerText = thresholdSoilValue;
});

//========== ONCLICK TO PUBLISH ==========
function togglePump(button) {
  if (button.innerText === "ON") {
    var message = "PUMP ON";
    if (message.trim() !== "") {
      client.publish("esp32/pump", message);
    }
  }
  if (button.innerText === "OFF") {
    var message = "PUMP OFF";
    if (message.trim() !== "") {
      client.publish("esp32/pump", message);
    }
  }
}

function toggleBulb(button) {
  if (button.innerText === "ON") {
    var message = "BULB ON";
    if (message.trim() !== "") {
      client.publish("esp32/bulb", message);
    }
  }
  if (button.innerText === "OFF") {
    var message = "BULB OFF";
    if (message.trim() !== "") {
      client.publish("esp32/bulb", message);
    }
  }
}

function toggleCurtain(button) {
  if (button.innerText === "ON") {
    var message = "CURTAIN ON";
    if (message.trim() !== "") {
      client.publish("esp32/curtain", message);
    }
  }
  if (button.innerText === "OFF") {
    var message = "CURTAIN OFF";
    if (message.trim() !== "") {
      client.publish("esp32/curtain", message);
    }
  }
}

function toggleMode(button) {
  if (button.innerText === "ON") {
    var message = "AUTO ON";
    if (message.trim() !== "") {
      client.publish("esp32/mode", message);
    }
  }
  if (button.innerText === "OFF") {
    var message = "AUTO OFF";
    if (message.trim() !== "") {
      client.publish("esp32/mode", message);
    }
  }
}
//UPDATE SOIL MOISTURE VALUE
function pullBar(value) {
  if (value.trim() !== "") {
    client.publish("esp32/soil", value);
  }
}
