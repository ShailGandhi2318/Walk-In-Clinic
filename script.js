document.addEventListener('DOMContentLoaded', () => {
  const faders = document.querySelectorAll('.fade-in');

  const appearOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('appear');
      appearOnScroll.unobserve(entry.target);
    });
  }, appearOptions);

  faders.forEach(fader => {
    appearOnScroll.observe(fader);
  });

  // Initialize appointment date restrictions
  initializeDateRestrictions();
  
  // Update login state display
  updateLoginState();
});

// Login state management
function isLoggedIn() {
  return sessionStorage.getItem('userLoggedIn') === 'true';
}

function getUserName() {
  return sessionStorage.getItem('userName') || 'Patient';
}

function setLoginState(username) {
  sessionStorage.setItem('userLoggedIn', 'true');
  sessionStorage.setItem('userName', username);
}

function clearLoginState() {
  sessionStorage.removeItem('userLoggedIn');
  sessionStorage.removeItem('userName');
}

function updateLoginState() {
  const userNameElement = document.getElementById('user-name');
  const userGreeting = document.querySelector('.user-greeting');
  const loginSection = document.querySelector('.nav-login');
  const bookIcon = document.querySelector('.book-icon');
  
  if (isLoggedIn()) {
    // User is logged in - show greeting and logout button
    if (userNameElement) {
      userNameElement.textContent = getUserName();
    }
    if (userGreeting) {
      userGreeting.style.display = 'inline';
    }
    if (loginSection && !document.querySelector('.logout-btn')) {
      // Replace login link with user greeting and logout button
      loginSection.innerHTML = `
        <span class="user-greeting">Welcome, <span id="user-name">${getUserName()}</span>!</span>
        <button class="logout-btn" onclick="logout()">Logout</button>
      `;
    }
    // Update book icon for logged in users
    if (bookIcon) {
      bookIcon.innerHTML = '📅 My Appointments';
      bookIcon.title = 'My Appointments';
      bookIcon.href = 'appointment-dashboard.html';
      bookIcon.onclick = null; // Remove onclick to use href
    }
  } else {
    // User is not logged in - show login link
    if (loginSection && !document.querySelector('.login-icon')) {
      loginSection.innerHTML = `
        <a href="login.html" class="login-icon" title="Login/Sign Up"><span>👤</span> Login/Sign Up</a>
      `;
    }
    // Update book icon for logged out users
    if (bookIcon) {
      bookIcon.innerHTML = '📅 Book';
      bookIcon.title = 'Book Appointment';
      bookIcon.href = '#';
      bookIcon.onclick = function(e) {
        e.preventDefault();
        handleBookAppointment();
      };
    }
  }
}

// Appointment booking redirect logic
function handleBookAppointment() {
  if (isLoggedIn()) {
    // Check if user has existing appointments first
    window.location.href = 'appointment-dashboard.html';
  } else {
    // Store the intended destination
    sessionStorage.setItem('redirectAfterLogin', 'appointment-dashboard.html');
    window.location.href = 'login.html';
  }
}

// Direct booking function (for new appointment button)
function goToBookAppointment() {
  if (isLoggedIn()) {
    window.location.href = 'book-appointment.html';
  } else {
    sessionStorage.setItem('redirectAfterLogin', 'book-appointment.html');
    window.location.href = 'login.html';
  }
}

// Initialize date restrictions for appointment booking
function initializeDateRestrictions() {
  const dateInput = document.getElementById('appointment-date');
  if (dateInput) {
    // Set minimum date to today
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    dateInput.min = formattedToday;
    
    // Set maximum date to 3 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    const formattedMaxDate = maxDate.toISOString().split('T')[0];
    dateInput.max = formattedMaxDate;
    
    // Add event listener to check if selected date is weekday
    dateInput.addEventListener('change', validateAppointmentDate);
  }
}

function validateAppointmentDate() {
  const dateInput = document.getElementById('appointment-date');
  const selectedDate = new Date(dateInput.value);
  const dayOfWeek = selectedDate.getDay();
  
  // Check if it's weekend (Sunday = 0, Saturday = 6)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    alert('Appointments are only available Monday through Friday. Please select a weekday.');
    dateInput.value = '';
    return false;
  }
  return true;
}

function logout() {
  clearLoginState();
  alert('You have been logged out successfully.');
  window.location.href = 'index.html';
}

function submitForm() {
  const name = document.getElementById('name')?.value;
  const email = document.getElementById('email')?.value;
  const message = document.getElementById('message')?.value;

  if (name && email && message) {
    console.log('Contact Form submitted:', { name, email, message });
    alert('Thank you for your message! We will get back to you soon.');
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('message').value = '';
  } else {
    alert('Please fill out all fields.');
  }
}

// OTP-based login functions
function getUserByPhone(phoneNumber) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users.find(user => user.contact === phoneNumber);
}

function verifyUserCredentials(phoneNumber, answers) {
  const user = getUserByPhone(phoneNumber);
  if (!user) return false;
  
  return user.securityAnswer1.toLowerCase() === answers[0].toLowerCase() &&
         user.securityAnswer2.toLowerCase() === answers[1].toLowerCase();
}

// Legacy login function (kept for backward compatibility, but now redirects to OTP flow)
function submitLoginForm() {
  alert('Please use the new OTP-based login system for enhanced security.');
  // This function is kept for compatibility but should redirect users to the OTP flow
}

// Enhanced appointment management functions
function generateAppointmentId() {
  return 'APT' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getStoredAppointments() {
  return JSON.parse(localStorage.getItem('appointments') || '[]');
}

function hasAppointmentConflict(doctor, date, time, excludeId = null) {
  const appointments = getStoredAppointments();
  const currentUser = getUserName();
  
  return appointments.some(apt => 
    apt.patient === currentUser &&
    apt.id !== excludeId && 
    apt.status !== 'cancelled' &&
    apt.doctor === doctor &&
    apt.date === date && 
    apt.time === time
  );
}

function hasAnyAppointmentConflict(date, time, excludeId = null) {
  const appointments = getStoredAppointments();
  const currentUser = getUserName();
  
  return appointments.some(apt => 
    apt.patient === currentUser &&
    apt.id !== excludeId && 
    apt.status !== 'cancelled' &&
    apt.date === date && 
    apt.time === time
  );
}

function getUserAppointments() {
  const appointments = getStoredAppointments();
  const currentUser = getUserName();
  return appointments.filter(apt => apt.patient === currentUser);
}

function submitAppointment() {
  const doctor = document.getElementById('doctor-select')?.value;
  const date = document.getElementById('appointment-date')?.value;
  const time = document.getElementById('appointment-time')?.value;
  const visitType = document.getElementById('visit-type')?.value;
  const symptoms = document.getElementById('symptoms')?.value;
  const contactMethod = document.getElementById('contact-method')?.value;

  if (!doctor || !date || !time || !visitType || !contactMethod) {
    alert('Please fill out all required fields.');
    return;
  }

  // Validate date is weekday
  if (!validateAppointmentDate()) {
    return;
  }

  // Check for appointment conflicts
  if (hasAppointmentConflict(doctor, date, time)) {
    alert('⚠️ Appointment Conflict!\n\nYou already have an appointment with this doctor on this date and time.\n\nPlease:\n• Choose a different time slot\n• Select a different date\n• Visit your appointment dashboard to reschedule existing appointments');
    return;
  }

  // Check for any time slot conflicts
  if (hasAnyAppointmentConflict(date, time)) {
    alert('⚠️ Time Slot Conflict!\n\nYou already have an appointment scheduled at this date and time with another doctor.\n\nPlease choose a different time slot or visit your appointment dashboard to manage existing appointments.');
    return;
  }

  // Get doctor display name
  const doctorSelect = document.getElementById('doctor-select');
  const doctorDisplayName = doctorSelect.options[doctorSelect.selectedIndex].text;
  
  // Get visit type display name
  const visitTypeSelect = document.getElementById('visit-type');
  const visitTypeDisplayName = visitTypeSelect.options[visitTypeSelect.selectedIndex].text;
  
  // Get contact method display name
  const contactMethodSelect = document.getElementById('contact-method');
  const contactMethodDisplayName = contactMethodSelect.options[contactMethodSelect.selectedIndex].text;

  const appointmentData = {
    id: generateAppointmentId(),
    patient: getUserName(),
    doctor: doctor,
    doctorName: doctorDisplayName,
    date: date,
    time: time,
    visitType: visitType,
    visitTypeName: visitTypeDisplayName,
    symptoms: symptoms,
    contactMethod: contactMethod,
    contactMethodName: contactMethodDisplayName,
    status: 'confirmed',
    timestamp: new Date().toISOString()
  };

  // Store appointment
  const existingAppointments = getStoredAppointments();
  existingAppointments.push(appointmentData);
  localStorage.setItem('appointments', JSON.stringify(existingAppointments));

  console.log('Appointment submitted:', appointmentData);
  
  // Format date for display
  const appointmentDate = new Date(date);
  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  alert(`Appointment booked successfully! 🎉

📋 Appointment Details:
🆔 Appointment ID: ${appointmentData.id}
👨‍⚕️ Doctor: ${doctorDisplayName}
📅 Date: ${formattedDate}
🕐 Time: ${time}  
🏥 Visit Type: ${visitTypeDisplayName}
📞 Contact: ${contactMethodDisplayName}

✅ Confirmation:
We will contact you within 24 hours to confirm your appointment. 
You can view and manage all your appointments in the "My Appointments" section.

Thank you for choosing GreenLeaf Clinic!`);
  
  // Reset form
  document.getElementById('doctor-select').value = '';
  document.getElementById('appointment-date').value = '';
  document.getElementById('appointment-time').value = '';
  document.getElementById('visit-type').value = '';
  document.getElementById('symptoms').value = '';
  document.getElementById('contact-method').value = '';
  
  // Redirect to appointment dashboard after successful booking
  setTimeout(() => {
    window.location.href = 'appointment-dashboard.html';
  }, 2000);
}

// OTP utility functions
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function formatPhoneNumber(phoneNumber) {
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

function maskPhoneNumber(phoneNumber) {
  return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) ***-$4');
}

// User management functions
function createUser(userData) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  users.push(userData);
  localStorage.setItem('users', JSON.stringify(users));
}

function userExists(phoneNumber, email, ohip) {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  return users.some(user => 
    user.contact === phoneNumber || 
    user.email === email || 
    user.ohip === ohip
  );
}

// Enhanced registration function for OTP support
function submitRegisterForm() {
  // This function is now handled by the registration page's OTP flow
  // Kept for backward compatibility
  console.log('Registration should use OTP flow');
}

// Account recovery functions
function initiateAccountRecovery(phoneNumber) {
  const user = getUserByPhone(phoneNumber);
  if (!user) {
    return { success: false, message: 'No account found with this phone number.' };
  }
  
  return {
    success: true,
    securityQuestion1: getSecurityQuestion(user.securityQuestion1),
    securityQuestion2: getSecurityQuestion(user.securityQuestion2)
  };
}

function getSecurityQuestion(questionKey) {
  const questions = {
    'mother-maiden': 'What is your mother\'s maiden name?',
    'first-pet': 'What was the name of your first pet?',
    'childhood-street': 'What street did you grow up on?',
    'favorite-teacher': 'What was your favorite teacher\'s name?',
    'first-school': 'What was the name of your first school?',
    'birth-city': 'In what city were you born?',
    'first-job': 'What was your first job?',
    'favorite-book': 'What is your favorite book?',
    'childhood-friend': 'What was your childhood best friend\'s name?',
    'favorite-food': 'What is your favorite food?'
  };
  return questions[questionKey] || questionKey;
}