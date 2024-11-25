// State management using a single object
const PomodoroState = {
  config: {
    workTime: 25 * 60,
    relaxTime: 5 * 60
  },
  timer: {
    remainingTime: 25 * 60,
    isRunning: false,
    startTime: null,
    interval: null,
    elapsedTime: 0
  },
  mode: {
    isTimer: true,
    isRelax: false,
    isStopwatch: false
  }
};
  
// Timer Controller Class
class TimerController {
  static setSessionConfig(workDuration, relaxDuration) { // Timer mode

    // Buttons config
    document.querySelectorAll('.timerButton').forEach((btn) => btn.classList.remove('active'));
    if (workDuration === 25) {
        document.querySelector('.timerButton:nth-child(1)').classList.add('active');
    } else if (workDuration === 50) {
        document.querySelector('.timerButton:nth-child(3)').classList.add('active');
    }
    //

    try {
        if (PomodoroState.timer.isRunning) {
            this.stopTimer();
            this.resetTimer();
        }
        PomodoroState.config.workTime = workDuration * 60;
        PomodoroState.config.relaxTime = relaxDuration * 60;
        PomodoroState.timer.remainingTime = PomodoroState.config.workTime;
        PomodoroState.mode = { isTimer: true, isRelax: false, isStopwatch: false };
        
        this.updateDisplay();
        this.toggleRelaxButton(); 
    } catch (error) {
        console.error('Error in setSessionConfig:', error);
        this.handleError('Failed to set session configuration');
    }
  }

  static startStopwatch() { // Stopwatch mode
    try {
      if (PomodoroState.timer.isRunning) {
        this.stopTimer();
        this.resetTimer();
      }

      // Buttons config
      document.querySelectorAll('.timerButton').forEach((btn) => {
        if (btn.id !== 'stopwatchButton') btn.classList.remove('active');
      });
      const stopwatchButton = document.getElementById('stopwatchButton');
      stopwatchButton.classList.add('active');
      //

      PomodoroState.mode = { isTimer: false, isRelax: false, isStopwatch: true };
      PomodoroState.timer.elapsedTime = 0;
      this.updateDisplay();
      this.toggleRelaxButton();
    } catch (error) {
      console.error('Error in startStopwatch:', error);
      this.handleError('Failed to start stopwatch');
    }
  }

  static startRelaxMode() { // Relax mode
    try{
      if (PomodoroState.timer.isRunning) {
        this.stopTimer();
        this.resetTimer();
      } 
      PomodoroState.mode.isRelax = true;
      PomodoroState.timer.remainingTime = PomodoroState.config.relaxTime;
      this.updateDisplay();
      this.toggleRelaxButton(); 
      this.toggleTimer();
    } catch(error) {
      console.error('Error in startRelaxMode:', error);
      this.handleError('Failed to start relax mode');
    }
  }

  static toggleTimer() { // Control time
    try {
      if(PomodoroState.mode.isStopwatch) { // Stopwatch control
        if (!PomodoroState.timer.isRunning) {
          PomodoroState.timer.isRunning = true;

          if (!PomodoroState.timer.startTime) {
              // Stopwatch started
              PomodoroState.timer.startTime = Date.now();
          } else {
              // After a break 
              const elapsedTimeBeforePause = PomodoroState.timer.elapsedTime;
              PomodoroState.timer.startTime = Date.now() - elapsedTimeBeforePause * 1000;
          }

          this.updateStopwatch();
          this.updateButtonState('break');
        } else {
          this.stopTimer();
          this.updateButtonState('play');
        }
      } else { // Timer control
          if (!PomodoroState.timer.isRunning) {
              PomodoroState.timer.isRunning = true;
  
              if (!PomodoroState.timer.startTime) {
                  // Timer started
                  PomodoroState.timer.startTime = Date.now();
              } else {
                  // After a break
                  const elapsedTimeBeforePause = PomodoroState.config.workTime - PomodoroState.timer.remainingTime;
                  PomodoroState.timer.startTime = Date.now() - elapsedTimeBeforePause * 1000;
              }
  
              this.updateTimer();
              this.updateButtonState('break');
          } else {
              this.stopTimer();
              this.updateButtonState('play');
          }
        }
    } catch (error) {
        console.error('Error in toggleTimer:', error);
        this.handleError('Failed to toggle timer');
    }
  }

  static toggleRelaxButton() { // Control relax mode
    const relaxButton = document.getElementById('relaxButton');
    
    if (PomodoroState.mode.isTimer && !PomodoroState.mode.isRelax) { // Relax button visible
        relaxButton.classList.remove('hidden');
        relaxButton.classList.add('visible');
        setTimeout(() => {
          if (relaxButton.classList.contains('visible')) {
              relaxButton.style.display = 'block';
          }
      }, 300);
    } else { // Relax button hidden
        relaxButton.classList.remove('visible');
        relaxButton.classList.add('hidden');
        setTimeout(() => {
            if (!relaxButton.classList.contains('visible')) {
                relaxButton.style.display = 'none';
            }
        }, 300); 
    }
  }

  static handleSessionEnd() { // Control end timer mode
    try {
        this.stopTimer();
        if (!PomodoroState.mode.isRelax) { 
          this.saveSession(PomodoroState.config.workTime, true);
          this.startRelaxMode();
        } else {
          this.resetTimer();
        }
    } catch (error) {
        console.error('Error in handleSessionEnd:', error);
        this.handleError('Failed to handle session end');
    }
  }

  static stopTimer() { // Stop time
    PomodoroState.timer.isRunning = false;
    clearTimeout(PomodoroState.timer.interval);
  }

  static resetTimer() { // Reset button
    if (PomodoroState.mode.isTimer) { // Timer mode 
        const timeElapsed = PomodoroState.config.workTime - PomodoroState.timer.remainingTime;
        this.stopTimer();
        if (timeElapsed > 0 && !PomodoroState.mode.isRelax) {
            this.saveSession(timeElapsed, false); // No session incremented
        }
        PomodoroState.mode.isRelax = false;
        PomodoroState.timer.remainingTime = PomodoroState.config.workTime;
    }
    else if (PomodoroState.mode.isStopwatch) { // Stopwatch mode
        if (PomodoroState.timer.elapsedTime > 0) {
            this.saveSession(PomodoroState.timer.elapsedTime, false);
        }
        this.stopTimer();
        PomodoroState.timer.elapsedTime = 0;
        PomodoroState.timer.startTime = null;
    }
    this.updateDisplay();
    this.updateButtonState('play');
    this.toggleRelaxButton();
  }

  static updateTimer() { // Update timer mode
    if (!PomodoroState.timer.isRunning || !PomodoroState.mode.isTimer) return;

    const currentTime = Date.now();
    const elapsedTimeInSeconds = Math.floor((currentTime - PomodoroState.timer.startTime) / 1000);
    const newRemainingTime = PomodoroState.config.workTime - elapsedTimeInSeconds;

    if (newRemainingTime <= 0) {
        PomodoroState.timer.remainingTime = 0;
        this.stopTimer();
        this.playSound(); // Play the song 
        this.handleSessionEnd();
    } else {
        this.updateDisplay();
        PomodoroState.timer.remainingTime = newRemainingTime;
        PomodoroState.timer.interval = setTimeout(() => this.updateTimer(), 100); 
    }
  }

  static updateStopwatch() { // Update stopwatch mode
    if (!PomodoroState.timer.isRunning || !PomodoroState.mode.isStopwatch) return;

    const currentTime = Date.now();
    PomodoroState.timer.elapsedTime = Math.floor((currentTime - PomodoroState.timer.startTime) / 1000);
    this.updateDisplay();

    PomodoroState.timer.interval = setTimeout(() => this.updateStopwatch(), 1000);
  }

  static updateButtonState(state) { // Update play/pause button
    const button = document.getElementById('startButton');
    button.textContent = state === 'play' ? '▶' : '||';
  }

  static updateDisplay() { // Update mode for timer (elapsed or remaining)
    const timeToDisplay = PomodoroState.mode.isStopwatch 
      ? PomodoroState.timer.elapsedTime 
      : PomodoroState.timer.remainingTime;
    document.getElementById('timer').textContent = formatTime(timeToDisplay);
  }

  static handleError(message) { // Errors
    window.alert(message);
  }

  static saveSession(duration, incrementSession) { // Save sessions
    SessionManager.saveSession(duration, incrementSession);
  }

  static playSound() { // Play the end song
    const audio = new Audio('sounds/ding.wav');
    audio.volume = 1;
    audio.oncanplaythrough = () => {
        audio.play().catch(error => {
            console.error('Error playing sound:', error);
        });
    };
    audio.onerror = () => {
        console.error('Failed to load audio.');
    };
  }

  static initializeAudio() { // Initialize audio 
      const audio = new Audio('sounds/ding.wav');
      audio.volume = 1;
      audio.play().catch(() => {
          console.log('Audio initialized but not played (awaiting user interaction).');
      });
  }
}

// Session Management Class
class SessionManager {
  static saveSession(duration, incrementSession) {
    const today = new Date().toISOString().split('T')[0];
    const storedSessions = this.getStoredSessions();
    
    if (!storedSessions[today]) {
        storedSessions[today] = { count: 0, total: 0 };
    }
    if (incrementSession) {
      try{
        if (duration === 25 * 60) {
          storedSessions[today].count += 1;
        } else if (duration === 50 * 60) {
          storedSessions[today].count += 2;
        } 
      } catch(error) {
        console.error('Error in saveSession');
        window.alert('Failed to save session');
      }
    }
    storedSessions[today].total += duration;
    localStorage.setItem('pomodoroSessions', JSON.stringify(storedSessions));
    this.updateSessionsDisplay();
    this.updateGraphs(window.currentWeekOffset || 0);
  }

  static getStoredSessions() {
    try {
      return JSON.parse(localStorage.getItem('pomodoroSessions')) || {};
    } catch (error) {
      console.error('Error parsing stored sessions:', error);
      return {};
    }
  }

  static updateSessionsDisplay() {
    const today = new Date().toISOString().split('T')[0];
    const storedSessions = this.getStoredSessions();
    const todayData = storedSessions[today] || { count: 0, total: 0 };

    document.getElementById('sessionsCount').textContent = `Sessions: ${todayData.count}`;
    
    const totalHours = Math.floor(todayData.total / 3600);
    const totalMinutes = Math.floor(todayData.total / 60) % 60;
    document.getElementById('totalTime').textContent = 
      `Total: ${totalHours} h ${totalMinutes} min`;
  }

  static showAllSessions() {
    const storedSessions = this.getStoredSessions();
    const container = document.getElementById('pastSessions');

    if (container.classList.contains('visible')) {
        container.classList.remove('visible');
        setTimeout(() => (container.style.display = 'none'), 100);
    } else {
        container.style.display = 'block';
        setTimeout(() => container.classList.add('visible'), 300);
    }
    
    
    // If no sessions are stored, show a placeholder message
    if (Object.keys(storedSessions).length === 0) {
      container.innerHTML = '<p class="session">No session save.</p>';
      return;
    }
  
    // Generate the session list HTML
    const sessionsHTML = Object.entries(storedSessions)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
      .map(([date, data]) => {
        const hours = Math.floor(data.total / 3600);
        const minutes = Math.floor(data.total / 60) % 60;
        return `
          <div class="session">
            <p>${date}: <strong>${data.count}</strong> sessions,
            Temps total: <strong>${hours} h ${minutes} min</strong></p>
            <button class="deleteButton" onclick="SessionManager.deleteDay('${date}')">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>`;
      })
      .join('');
  
    // Update the container's content
    container.innerHTML = `${sessionsHTML}`;
  }
  
  static deleteDay(date) {
    const storedSessions = this.getStoredSessions();
    if (storedSessions[date]) {
      delete storedSessions[date];
      localStorage.setItem('pomodoroSessions', JSON.stringify(storedSessions));
      this.showAllSessions();
      this.updateSessionsDisplay();
    }
    
  }

  static getWeekData(weekOffset = 0) {
    const storedSessions = this.getStoredSessions();
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    
    // Get start and end of week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek.getDate() + 6);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekData = {
        labels: [],
        times: [],
        sessions: []
    };

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];
        
        const dayData = storedSessions[dateString] || { count: 0, total: 0 };
        weekData.labels.push(currentDate.toLocaleDateString('en-EN', { weekday: 'short' }));
        // Convert seconds to minutes for the time graph
        weekData.times.push(dayData.total / 3600);
        weekData.sessions.push(dayData.count);
    }

    return weekData;
  }

  static updateGraphs(weekOffset = 0) {
    const weekData = this.getWeekData(weekOffset);

    const startDate = new Date();
    const endDate = new Date(startDate); // Copie de startDate
    startDate.setDate(startDate.getDate() + (weekOffset * 7));
    startDate.setDate(startDate.getDate() - startDate.getDay());
    endDate.setDate(startDate.getDate() + 6)
    const weekNumber = this.getWeekNumber(startDate);

    const weekNumberElement_text = document.getElementById('timeStartOfWeekDateText');
    const weekNumberElement_number = document.getElementById('timeStartOfWeekDateNumber');
    if (weekNumberElement_text) {
        const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
        weekNumberElement_text.textContent = `${startDate.toLocaleDateString('en-EN', dateOptions)} - ${endDate.toLocaleDateString('en-EN', dateOptions)}`;
    }
    
    if (weekNumberElement_number) {
        weekNumberElement_number.textContent = `Week ${weekNumber}`;
    }

    const timeCanvas = document.getElementById('timeGraph');
    const sessionsCanvas = document.getElementById('sessionsGraph');

    if (!timeCanvas || !sessionsCanvas) {
        console.error('Canvas elements not found');
        return;
    }

    const timeCtx = timeCanvas.getContext('2d');
    const sessionsCtx = sessionsCanvas.getContext('2d');

    if (window.timeChart) window.timeChart.destroy();
    if (window.sessionsChart) window.sessionsChart.destroy();

    // Fonction pour ajuster la taille de police en fonction de la largeur de l'écran
    const getResponsiveFontSize = () => {
        const width = window.innerWidth;
        if (width > 1024) return 14; // Grands écrans
        if (width > 768) return 10;  // Tablettes
        return 6;                   // Petits écrans
    };

    // Get the current day to match the labels
    const today = new Date().toLocaleDateString('en-EN', { weekday: 'short' });

    // Création du graphique des heures
    window.timeChart = new Chart(timeCtx, {
      type: 'bar',
      data: {
          labels: weekData.labels,
          datasets: [{
              label: 'Hours per day', // Texte de la légende
              data: weekData.times,
              backgroundColor: weekData.labels.map((label) => {
                  return label === today ? 'blue' : 'skyblue';
              }),
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
              legend: {
                  display: true, // Forcer l'affichage de la légende
                  labels: {
                      color: '#fff', // Couleur du texte de la légende
                      font: {
                          size: getResponsiveFontSize(), // Taille dynamique
                      },
                      usePointStyle: true, // Utiliser des points au lieu des carrés
                      pointStyle: 'rect' // Style du point dans la légende
                  }
              },
              tooltip: {
                  enabled: true,
                  callbacks: {
                      label: (tooltipItem) => `${tooltipItem.raw.toFixed(2)} hours`
                  }
              }
          },
          scales: {
              display: true,
              x: {
                  ticks: { color: '#fff', font: { size: getResponsiveFontSize() } },
                  grid: { color: 'transparent' }
              },
              y: {
                  beginAtZero: true,
                  ticks: { color: '#fff', font: { size: getResponsiveFontSize() }, stepSize: 1 },
                  grid: { color: 'rgba(255, 255, 255, 0.2)' }
              }
          }
      }
  });

    // Création du graphique des sessions
    window.sessionsChart = new Chart(sessionsCtx, {
      type: 'bar',
      data: {
          labels: weekData.labels,
          datasets: [{
              label: 'Sessions per day', // Texte de la légende
              data: weekData.sessions,
              backgroundColor: weekData.labels.map((label) => {
                  return label === today ? 'green' : 'lightgreen';
              }),
              borderColor: 'rgba(255, 255, 255, 0.5)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
              legend: {
                  display: true, // Forcer l'affichage de la légende
                  labels: {
                      color: '#fff', // Couleur du texte de la légende
                      font: {
                          size: getResponsiveFontSize(), // Taille dynamique
                          weight: 'italic bold', // Poids du texte
                      },
                      usePointStyle: true, // Utiliser des points au lieu des carrés
                      pointStyle: 'rect' // Style du point dans la légende
                  }
              },
              tooltip: {
                  enabled: true,
                  callbacks: {
                      label: (tooltipItem) => `${tooltipItem.raw} sessions`
                  }
              }
          },
          scales: {
              x: {
                  ticks: { color: '#fff', font: { size: getResponsiveFontSize() } },
                  grid: { color: 'transparent' }
              },
              y: {
                  beginAtZero: true,
                  ticks: { color: '#fff', font: { size: getResponsiveFontSize() }, stepSize: 1 },
                  grid: { color: 'rgba(255, 255, 255, 0.2)' }
              }
          }
      }
    });

    // Mise à jour des tailles dynamiques lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
        const fontSize = getResponsiveFontSize();
        window.timeChart.options.plugins.legend.labels.font.size = fontSize;
        window.timeChart.options.scales.x.ticks.font.size = fontSize;
        window.timeChart.options.scales.y.ticks.font.size = fontSize;

        window.sessionsChart.options.plugins.legend.labels.font.size = fontSize;
        window.sessionsChart.options.scales.x.ticks.font.size = fontSize;
        window.sessionsChart.options.scales.y.ticks.font.size = fontSize;

        window.timeChart.update();
        window.sessionsChart.update();
    });
  }


  static getWeekNumber(date) {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
}
  
// Utility functions
const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

function configureHighDpiCanvas(canvas, options = {}) {
  const ctx = canvas.getContext("2d");

  // Obtenez la largeur et la hauteur CSS
  const width = options.width || canvas.offsetWidth;
  const height = options.height || canvas.offsetHeight;

  // Facteur de densité de pixels
  const dpr = window.devicePixelRatio || 1;

  // Ajustez la taille logique et physique
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Fixez la taille CSS
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  // Appliquez l'échelle pour une netteté optimale
  ctx.scale(dpr, dpr);

  return ctx;
}

// Initialize window.currentWeekOffset at the start
window.currentWeekOffset = 0;

// Define the changeWeek function
window.changeWeek = (offset) => {
    // Récupérer les canvas
    const timeGraphCanvas = document.getElementById("timeGraph");
    const sessionsGraphCanvas = document.getElementById("sessionsGraph");

    // Ajouter la classe 'exiting' pour animer la sortie
    timeGraphCanvas.classList.add("exiting");
    sessionsGraphCanvas.classList.add("exiting");

    // Attendre la fin de l'animation de sortie avant de mettre à jour les données
    setTimeout(() => {
        // Mettre à jour les données de la semaine
        window.currentWeekOffset += offset;
        SessionManager.updateGraphs(window.currentWeekOffset);

        // Retirer la classe 'exiting' et ajouter 'entering' pour animer l'entrée
        timeGraphCanvas.classList.remove("exiting");
        timeGraphCanvas.classList.add("entering");

        sessionsGraphCanvas.classList.remove("exiting");
        sessionsGraphCanvas.classList.add("entering");

        // Retirer la classe 'entering' après la transition
        setTimeout(() => {
            timeGraphCanvas.classList.remove("entering");
            sessionsGraphCanvas.classList.remove("entering");
        }, 300); 
    }, 300); 
  }

// Update the initialization code
document.addEventListener('DOMContentLoaded', () => {
    // Initialize everything else
    SessionManager.updateSessionsDisplay();
    TimerController.updateDisplay();
    
    // Set today's date
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('today').textContent = today.toLocaleDateString('en-EN', options);

    const timeCanvas = document.getElementById('timeGraph');
    const sessionsCanvas = document.getElementById('sessionsGraph');

    configureHighDpiCanvas(timeCanvas);
    configureHighDpiCanvas(sessionsCanvas);

    // Mettez à jour les graphiques
    SessionManager.updateGraphs(window.currentWeekOffset || 0);
});


