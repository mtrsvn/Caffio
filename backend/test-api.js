fetch("http://localhost:4000/api/recommendations", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userLogs: [{ coffeeType: "Latte", tasteProfile: ["sweet"], rating: 5, favorite: true }]
  })
}).then(r => r.json()).then(console.log).catch(console.error);
