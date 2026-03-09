match /users/{uid}/trackCompletions/{doc} {
  allow read, write: if request.auth.uid == uid;
}


add to firestore rules