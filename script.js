// script.js

document.addEventListener('DOMContentLoaded', () => {
    const inputA = document.getElementById('inputA');
    const inputB = document.getElementById('inputB');
    const inputMax = document.getElementById('inputMax');
    const plotButton = document.getElementById('plotButton');
    const ctx = document.getElementById('myChart').getContext('2d');
    let chart;

    class Regimen {
        constructor(name, dose, period, halflife) {
            this.name = name;
            this.dose = dose;
            this.period = period;       //in hours
            this.halflife = halflife;   //in hours
        }
    }

    class Settings{
        constructor(min_time, max_time, time_step){
            this.min_time = min_time;
            this.max_time = max_time;
            this.time_step = time_step; //in hours
        }
    }

  
    function generateData(regimens, settings) {
        // generate a list of time steps
        

    }
  
    function plotGraph() {
      const a = parseFloat(inputA.value);
      const b = parseFloat(inputB.value);
      const max = parseFloat(inputMax.value);
  
      const data = generateData(a, b, max);
  
      const maxY = Math.max(...data.map(point => point.y)) * 1.2;
  
      const config = {
        type: 'line',
        data: {
          datasets: [{
            label: `y = ${a} + ${b}x`,
            data: data,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false,
            tension: 0,
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              min: 0,
              max: max,
              title: {
                display: true,
                text: 'x',
              },
            },
            y: {
              min: 0,
              max: maxY,
              title: {
                display: true,
                text: 'y',
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
        }
      };
  
      if (chart) {
        chart.destroy();
      }
  
      chart = new Chart(ctx, config);
    }
  
    // Initial plot
    plotGraph();
  
    // Update the graph when the button is clicked
    plotButton.addEventListener('click', plotGraph);
  });
  