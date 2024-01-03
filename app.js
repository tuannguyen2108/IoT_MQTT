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
//Kết nối MQTT
var client = mqtt.connect("wss://smartgarden.cloud.shiftr.io", {
   username: "smartgarden",
   password: "Qhso0aAn9XUrGkYN",
 });
// var client = mqtt.connect("wss://esp32webserver.cloud.shiftr.io", {
//   username: "esp32webserver",
//   password: "GUI7C1I3bnkqHUcR",
// });

// PUBLISH BROKER
// var client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

client.on("connect", function () {
  console.log("Connected to shiftr.io broker");
  client.subscribe("esp32/json");
});

client.on("message", function (topic, message) {
  var data = JSON.parse(message.toString());
  // console.log("Received message:", data);
  var humValue = parseInt(data.Humidity) / 100;
  var tempValue = parseInt(data.Temperature) / 100;
  var soilValue = parseInt(data.Soil_Humidity) / 100;
  var thresholdSoilValue = parseInt(data.Ref_Value);
  var lightStatus = data.Light_Status;
  var rainStatus = data.Rain_Status;
  var modeStatus = data.Mode_Status;
  var bulbStatus = data.Bulb_Status; // Đã sửa từ "bulbStatus" thành "bulbStatus"
  var pumpStatus = data.Pump_Status;
  var curtainStatus = data.Curtain_Status;
  var xImg = document.getElementById("rain-img-non");
  var rainBlock = document.getElementById("rain-status");
  var lightBlock = document.getElementById("light-status");
  var lightImg = document.getElementById("light-img");
  var modeButton = document.getElementById("mode");
  var pumpButton = document.getElementById("pump");
  var buldButton = document.getElementById("bulb");
  var curtainButton = document.getElementById("curtain");
  var soilValueProgress = document.getElementById("soil-value");
  console.log(soilValue);
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

  if (rainStatus == "MƯA") {
    rainBlock.style.backgroundColor = "#E0F4FF";
    xImg.style.display = "none";
  } else {
    rainBlock.style.backgroundColor = "#ffffff";
    xImg.style.display = "block";
  }

  if (lightStatus == "TỐI") {
    lightBlock.style.backgroundColor = "#27536b";
    lightImg.src = "img/moon-icon.png";
  } else {
    lightBlock.style.backgroundColor = "#FFF6E0";
    lightImg.src = "img/sun-icon.png";
  }

  function toggleButton(button, status, string) {
    if (status == `${string}`) {
      button.style.backgroundColor = "#ffffff";
    } else {
      button.style.backgroundColor = "#FFF6E0";
    }
  }
  toggleButton(modeButton, modeStatus, "TẮT");
  toggleButton(pumpButton, pumpStatus, "TẮT");
  toggleButton(buldButton, bulbStatus, "TẮT");
  toggleButton(curtainButton, curtainStatus, "THU");

  // get value for threshold Soil title
  soilValueProgress.innerText = thresholdSoilValue;
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
//////////////////
const firebaseConfig = {
  apiKey: "AIzaSyCULGnctdhnqhv-88WGcLFuiox2FXg3W6g",
  authDomain: "pbl5-1c94d.firebaseapp.com",
  databaseURL: "https://pbl5-1c94d-default-rtdb.firebaseio.com",
  projectId: "pbl5-1c94d",
  storageBucket: "pbl5-1c94d.appspot.com",
  messagingSenderId: "1016691935021",
  appId: "1:1016691935021:web:c17a67889dbd9b2a67b5a4",
  measurementId: "G-E1T8CKZ1E2"
};

firebase.initializeApp(firebaseConfig);
var storage = firebase.storage();
var imagePath = "images/photo.jpg";

// Hàm để cập nhật ảnh từ Firebase Storage
function updateImage() {
  storage
    .ref()
    .child(imagePath)
    .getDownloadURL()
    .then(function (url) {
      // Gán đường dẫn ảnh vào thuộc tính src của thẻ img
      $("#image").attr("src", url);
      $("#image").css("width", "400px");
    })
    .catch(function (error) {
      console.log(error);
    });
}

// Cập nhật ảnh mỗi 2 giây (2000 milliseconds)
setInterval(updateImage, 2000);

// Gọi hàm updateImage lần đầu khi trang được tải
updateImage();
