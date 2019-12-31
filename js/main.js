{

/* ========================
  Variables
======================== */
// firebase deploy --only hosting

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_MESSAGING = firebase.messaging();
const FIREBASE_DATABASE = firebase.database();

const signInButton = document.getElementById("sign-in");
const signOutButton = document.getElementById("sign-out");
const subscribeButton = document.getElementById("subscribe");
const unsubscribeButton = document.getElementById("unsubscribe");
const sendNotificationForm = document.getElementById("send-notification-form");

/* ========================
  Event Listeners
======================== */

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);
subscribeButton.addEventListener('click', subscribeToNotifications);
unsubscribeButton.addEventListener('click', unsubscribeFromNotifications);
sendNotificationForm.addEventListener('submit', sendNotification);

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);
FIREBASE_MESSAGING.onTokenRefresh(handleTokenRefresh);

/* ========================
  Functions
======================== */

function signIn() {
  FIREBASE_AUTH.signInWithPopup( new firebase.auth.GoogleAuthProvider());
}

function signOut() {
  FIREBASE_AUTH.signOut();
}

function handleAuthStateChanged(user) {
  if(user) {
    console.log(user);

    signInButton.setAttribute("hidden", "true");
    signOutButton.removeAttribute("hidden");

    checkSubscription();
  } else {
    console.log("no user");

    signOutButton.setAttribute("hidden", "true");
    signInButton.removeAttribute("hidden");
  }
}

function subscribeToNotifications() {
  FIREBASE_MESSAGING.requestPermission()
  .then(() => handleTokenRefresh())
  .then(() => checkSubscription())
  .catch(() => {
    console.log("user didn't accept permission !")
  });
}

function handleTokenRefresh() {
  return FIREBASE_MESSAGING.getToken()
    .then((token) => {
      //console.log(token)

      FIREBASE_DATABASE.ref('/tokens').push({
        token: token,
        uid: FIREBASE_AUTH.currentUser.uid
      });
    })
    .catch(() => {
      console.log("user didn't accept permission !")
    });
  }

  function unsubscribeFromNotifications() {
    FIREBASE_MESSAGING.getToken()
    .then((token) => FIREBASE_MESSAGING.deleteToken(token))
    .then(() => FIREBASE_DATABASE.ref('/tokens').orderByChild('uid').equalTo(FIREBASE_AUTH.currentUser.uid)
    .once('value'))
    .then((snapshot) => {
      console.log(snapshot.val())
      const key = Object.keys(snapshot.val())[0];
      return FIREBASE_DATABASE.ref('/tokens').child(key).remove();
    })
    .then(() => checkSubscription())
    .catch(() => {
      console.log("Failed to unsubscribe user :(");
    });
  }

  function checkSubscription() {
    FIREBASE_DATABASE.ref('/tokens').orderByChild('uid').equalTo(FIREBASE_AUTH.currentUser.uid)
    .once('value')
    .then((snapshot) => {
      if(snapshot.val()) {
        subscribeButton.setAttribute("hidden", "true");
        unsubscribeButton.removeAttribute("hidden");
      } else {
        subscribeButton.removeAttribute("hidden");
        unsubscribeButton.setAttribute("hidden", "true");
      }
    })
  }

  function sendNotification(e) {
    e.preventDefault();

    const notificationMessage = document.getElementById('notification-message').value;

    FIREBASE_DATABASE.ref('/notifications').push({
      user: FIREBASE_AUTH.currentUser.displayName,
      message: notificationMessage,
      userProfileImage: FIREBASE_AUTH.currentUser.photoURL
    })
    .then(() => {
      document.getElementById('notification-message').value = "";
    });
  }

}