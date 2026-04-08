const TARGET_LAT = 28.4758963;
const TARGET_LON = 77.4986127;
const RADIUS_KM = 5;
const STORAGE_KEY = "career_boost_attendance_locked";

const verifyButton = document.getElementById("verifyButton");
const formSection = document.getElementById("formSection");

const modal = document.getElementById("statusModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalAccent = document.getElementById("modalAccent");
const modalAction = document.getElementById("modalAction");

function openModal(type, title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;

  if (type === "error") {
    modalAccent.style.background = "linear-gradient(120deg, #e84a1f, #b61f2f)";
    modalAction.style.background = "#9e1f2c";
  } else if (type === "warning") {
    modalAccent.style.background = "linear-gradient(120deg, #f0a500, #d97706)";
    modalAction.style.background = "#9a5b00";
  } else {
    modalAccent.style.background = "linear-gradient(120deg, #1f9d55, #0d9a50)";
    modalAction.style.background = "#116e3d";
  }

  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

modalAction.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal === "true") {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    });
  });
}

async function ensurePermissionState() {
  if (!navigator.permissions || !navigator.permissions.query) {
    return "unknown";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch (_error) {
    return "unknown";
  }
}

function isAttendanceLocked() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function lockAttendance() {
  localStorage.setItem(STORAGE_KEY, "true");
}

function unlockForm() {
  formSection.classList.remove("hidden");
  verifyButton.disabled = true;
  verifyButton.textContent = "Attendance Unlocked";
}

function handleGeoError(error) {
  if (!error || typeof error.code !== "number") {
    openModal(
      "error",
      "Unable to Verify Location",
      "We could not read your location. Please make sure your GPS/location is turned on and try again."
    );
    return;
  }

  if (error.code === 1) {
    openModal(
      "error",
      "Location Permission Required",
      "Location access was denied. Please allow location permission in your browser settings, then try again."
    );
    return;
  }

  if (error.code === 2) {
    openModal(
      "error",
      "Location Unavailable",
      "Your location could not be determined. Move to an open area, enable GPS, and retry."
    );
    return;
  }

  if (error.code === 3) {
    openModal(
      "warning",
      "Request Timed Out",
      "Location request timed out. Please check internet/GPS and try again."
    );
    return;
  }

  openModal(
    "error",
    "Location Check Failed",
    "Something went wrong while verifying location. Please try once more."
  );
}

async function verifyAndUnlockAttendance() {
  if (isAttendanceLocked()) {
    openModal(
      "warning",
      "Attendance Already Used",
      "This attendance page can be accessed only one time from this browser. Access is now locked."
    );
    verifyButton.disabled = true;
    verifyButton.textContent = "Access Locked";
    return;
  }

  verifyButton.disabled = true;
  verifyButton.textContent = "Checking Location...";

  const permissionState = await ensurePermissionState();
  if (permissionState === "denied") {
    verifyButton.disabled = false;
    verifyButton.textContent = "Verify Location and Open Form";
    openModal(
      "error",
      "Location Permission Blocked",
      "Location permission is blocked for this site. Enable it from browser settings and reload this page."
    );
    return;
  }

  try {
    const position = await getCurrentPosition();
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    const distance = haversineKm(userLat, userLon, TARGET_LAT, TARGET_LON);

    if (distance > RADIUS_KM) {
      verifyButton.disabled = false;
      verifyButton.textContent = "Verify Location and Open Form";
      openModal(
        "error",
        "Outside Allowed Location",
        `You are ${distance.toFixed(2)} km away from the workshop location. Attendance is allowed only within 5 km.`
      );
      return;
    }

    lockAttendance();
    unlockForm();

    openModal(
      "success",
      "Location Verified",
      "Attendance form is unlocked. You now have one-time access on this browser for this workshop attendance."
    );
  } catch (error) {
    verifyButton.disabled = false;
    verifyButton.textContent = "Verify Location and Open Form";
    handleGeoError(error);
  }
}

function init() {
  if (isAttendanceLocked()) {
    verifyButton.disabled = true;
    verifyButton.textContent = "Access Locked";
    openModal(
      "warning",
      "Attendance Locked",
      "Attendance for this workshop has already been opened once on this browser. Multiple access is not allowed."
    );
    return;
  }

  verifyButton.addEventListener("click", verifyAndUnlockAttendance);
}

init();
