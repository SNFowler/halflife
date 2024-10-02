// script.js

document.addEventListener('DOMContentLoaded', () => {
    // References to HTML elements
    const addRegimenButton = document.getElementById('addRegimenButton');
    const regimensContainer = document.getElementById('regimensContainer');
    const plotButton = document.getElementById('plotButton');
    const minTimeInput = document.getElementById('minTime');
    const maxTimeInput = document.getElementById('maxTime');
    const ctx = document.getElementById('myChart').getContext('2d');
    let chart;
  
    // Array to store regimen objects
    let regimens = [];
  
    class Regimen {
      constructor(name, dose, period, delay, halflife) {
        this.name = name;
        this.dose = parseFloat(dose);
        this.period = parseFloat(period);     // in hours
        this.delay = parseFloat(delay);       // in hours
        this.halflife = parseFloat(halflife); // in hours
      }
    }
  
    class Settings {
      constructor(min_time, max_time, time_step) {
        this.min_time = min_time;
        this.max_time = max_time;
        this.time_step = time_step;
      }
    }
  
    function apply_metabolism(halflife, timestep, drug_levels) {
      const multiplicative_loss = Math.pow(0.5, timestep / halflife);
      for (let j = 1; j < drug_levels.length; j++) {
        drug_levels[j] += drug_levels[j - 1] * (multiplicative_loss - 1);
      }
    }
  
    function generateData(regimens, settings) {
      const num_time_entries = Math.ceil((settings.max_time - settings.min_time) / settings.time_step) + 1;
      const x = [];
      for (let i = 0; i < num_time_entries; i++) {
        x.push(settings.min_time + i * settings.time_step);
      }
  
      // Sort regimens by name
      regimens.sort((a, b) => a.name.localeCompare(b.name));
  
      const full_data = {};
      let p = 0;
      let currentName = regimens.length > 0 ? regimens[0].name : null;
      let drug_levels = Array(x.length).fill(0);
  
      while (p < regimens.length) {
        const regimen = regimens[p];
        const multiplicative_loss = Math.pow(0.5, settings.time_step / regimen.halflife);
        const doses = Array(x.length).fill(0);
  
        // Schedule doses
        for (let q = 0; q < x.length; q++) {
          const time = x[q];
          if (time >= regimen.delay && ((time - regimen.delay) % regimen.period) === 0) {
            doses[q] += regimen.dose;
          }
        }
  
        // Add doses to drug_levels
        for (let q = 0; q < x.length; q++) {
          drug_levels[q] += doses[q];
        }
  
        // Apply metabolism
        for (let j = 1; j < drug_levels.length; j++) {
          drug_levels[j] += drug_levels[j - 1] * (multiplicative_loss - 1);
        }
  
        // Check if next regimen has a different name or if we're at the last regimen
        const nextRegimen = regimens[p + 1];
        if (!nextRegimen || nextRegimen.name !== currentName) {
          // Add to full_data
          const dataPoints = x.map((time, index) => ({ x: time, y: drug_levels[index] }));
          full_data[currentName] = dataPoints;
          // Reset drug_levels
          drug_levels = Array(x.length).fill(0);
          // Update currentName
          currentName = nextRegimen ? nextRegimen.name : null;
        }
  
        p++;
      }
  
      return full_data;
    }
  
    function plotGraph() {
      const minTime = parseFloat(minTimeInput.value);
      const maxTime = parseFloat(maxTimeInput.value);
  
      if (isNaN(minTime) || isNaN(maxTime) || minTime >= maxTime) {
        alert('Please enter valid min and max time values.');
        return;
      }
  
      const settings = new Settings(minTime, maxTime, 1); // time_step is 1 hour
  
      const data = generateData(regimens, settings);
  
      // Prepare datasets for Chart.js
      const datasets = [];
      let maxY = 0;
  
      Object.keys(data).forEach((drugName, index) => {
        const drugData = data[drugName];
        const maxDrugLevel = Math.max(...drugData.map(point => point.y));
        if (maxDrugLevel > maxY) {
          maxY = maxDrugLevel;
        }
  
        datasets.push({
          label: drugName,
          data: drugData,
          borderColor: getColor(index),
          borderWidth: 2,
          fill: false,
          tension: 0,
        });
      });
  
      maxY *= 1.2; // Add some padding to the max Y value
  
      const config = {
        type: 'line',
        data: {
          datasets: datasets,
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              min: minTime,
              max: maxTime,
              title: {
                display: true,
                text: 'Time (hours)',
              },
            },
            y: {
              min: 0,
              max: maxY,
              title: {
                display: true,
                text: 'Drug Level',
              },
            },
          },
          plugins: {
            legend: {
              display: true,
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        },
      };
  
      if (chart) {
        chart.destroy();
      }
  
      chart = new Chart(ctx, config);
    }
  
    // Function to generate colors for datasets
    function getColor(index) {
      const colors = [
        'rgba(75, 192, 192, 1)',
        'rgba(192, 75, 192, 1)',
        'rgba(192, 192, 75, 1)',
        'rgba(75, 75, 192, 1)',
        'rgba(192, 75, 75, 1)',
        'rgba(75, 192, 75, 1)',
      ];
      return colors[index % colors.length];
    }
  
    // Function to add a new regimen form
    function addRegimenForm(regimen = null) {
      const regimenDiv = document.createElement('div');
      regimenDiv.className = 'regimen';
  
      regimenDiv.innerHTML = `
        <label>
          Name:
          <input type="text" class="regimen-name" value="${regimen ? regimen.name : ''}">
        </label>
        <label>
          Dose:
          <input type="number" class="regimen-dose" value="${regimen ? regimen.dose : ''}">
        </label>
        <label>
          Period (hrs):
          <input type="number" class="regimen-period" value="${regimen ? regimen.period : ''}">
        </label>
        <label>
          Delay (hrs):
          <input type="number" class="regimen-delay" value="${regimen ? regimen.delay : ''}">
        </label>
        <label>
          Half-life (hrs):
          <input type="number" class="regimen-halflife" value="${regimen ? regimen.halflife : ''}">
        </label>
        <button class="copy-regimen">Copy</button>
        <button class="remove-regimen">Remove</button>
      `;
  
      // Event listener for copy button
      regimenDiv.querySelector('.copy-regimen').addEventListener('click', () => {
        const copiedRegimen = getRegimenFromForm(regimenDiv);
        addRegimenForm(copiedRegimen);
      });
  
      // Event listener for remove button
      regimenDiv.querySelector('.remove-regimen').addEventListener('click', () => {
        regimensContainer.removeChild(regimenDiv);
      });
  
      regimensContainer.appendChild(regimenDiv);
    }
  
    // Function to get regimen data from a form
    function getRegimenFromForm(regimenDiv) {
      const name = regimenDiv.querySelector('.regimen-name').value;
      const dose = regimenDiv.querySelector('.regimen-dose').value;
      const period = regimenDiv.querySelector('.regimen-period').value;
      const delay = regimenDiv.querySelector('.regimen-delay').value;
      const halflife = regimenDiv.querySelector('.regimen-halflife').value;
  
      return new Regimen(name, dose, period, delay, halflife);
    }
  
    // Event listener for Add Regimen button
    addRegimenButton.addEventListener('click', () => {
      addRegimenForm();
    });
  
    // Event listener for Plot Graph button
    plotButton.addEventListener('click', () => {
      // Clear regimens array
      regimens = [];
      // Get all regimens from forms
      const regimenDivs = document.querySelectorAll('.regimen');
      regimenDivs.forEach(regimenDiv => {
        const regimen = getRegimenFromForm(regimenDiv);
        regimens.push(regimen);
      });
  
      plotGraph();
    });
  
    // Initial plot with default settings
    addRegimenForm(); // Add an initial empty regimen form
  });
  