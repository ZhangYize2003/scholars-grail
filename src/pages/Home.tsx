import { Button } from "react-bootstrap";
import { auth } from "../firebaseSetup";
import { signOut } from "firebase/auth";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// basic home page, website features to be added here
const Home = () => {
  const user = useContext(AuthContext);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "100px" }}>
      <h2>Welcome!</h2>
      <p style={{ marginBottom: "24px" }}>
        Signed in as <b>{user?.email}</b>
      </p>
      <Button onClick={handleSignOut} variant="danger" style={{ marginTop: "0" }}>
        Sign Out
      </Button>
    </div>
  );
};

export default Home;