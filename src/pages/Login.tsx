import React, { useRef, useState } from "react";
import { Button, Col, Container, Form, Navbar, Row } from "react-bootstrap";
import scholarsGrailLogo from "../components/scholarsGrailLogo.png";
import { auth } from "../firebaseSetup";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword
} from "firebase/auth";
import "../components/styles.css";

//login page 
const Login = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  const [signUpMode, setSignUpMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Signing-up function
  const createAccount = async () => {
    setError(null); 
    setSuccess(null);
    if (signUpMode){
      const password = passwordRef.current!.value;
      const confirmPassword = confirmPasswordRef.current!.value;
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      try {
        await createUserWithEmailAndPassword(
          auth,
          emailRef.current!.value,
          passwordRef.current!.value
        );
        setSignUpMode(false);
        setSuccess("Account created successfully");
        passwordRef.current!.value = "";
        confirmPasswordRef.current!.value = "";
      } catch (error: any) { //handle all errors from input
        if (error.code === "auth/email-already-in-use") {
          setError("Email already in use");
        } else if (error.code === "auth/invalid-email") {
          setError("Invalid email address");
        } else if (error.code === "auth/weak-password") {
          setError("Password should be at least 6 characters");
        } else if (error.code === "auth/missing-password") {
          setError("Empty password");
        }  else if (error.code === "auth/missing-email") {
          setError("Empty email");
        }  else if (error.code !== undefined) {
          console.log(error.code);
          setError("An error occurred. Please try again.");
        }
      }
    } else {
      setSignUpMode(true);
      setSuccess(null);
    }
  };

  // Signing-in function
  const signInUser = async () => {
    try {
      await signInWithEmailAndPassword( // wait for firebase to respond to the sign-in request
        auth,
        emailRef.current!.value,
        passwordRef.current!.value
      );
    } catch (error: any) { //handle all errors from input
      if (
        error.code === "auth/invalid-email" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) { 
        setError("Invalid email or password.");
      } else if (error.code === "auth/missing-password") {
        setError("Empty password");
      } else {
        console.log(error.code);
        setError("An error occurred. Please try again.");
      }
      console.error(error);
    }
  };

  return (
    <> {/*bar at the top of the page */}
      <Navbar className="custom-navbar" variant="dark" expand="lg"> 
        <Navbar.Brand className="brand-title" href="#">
          <img
            src={scholarsGrailLogo}
            alt="Scholars Grail Logo"
            style={{
              height: "75px",
              width: "75px",
              marginRight: "12px",
              verticalAlign: "middle",
              borderRadius: "8px",
            }}
          />
          Scholar's Grail
        </Navbar.Brand>
      </Navbar>

      {/* container to input email and password */}
      <Container className="form-container" style={{ maxWidth: "480px" }} fluid>
        <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", color: "#232526", textAlign: "center" }}>
          Sign Up / Sign In
        </h2>
        <Form>
          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control ref={emailRef} type="email" placeholder="example@gmail.com" />
          </Form.Group>

          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control ref={passwordRef} type="password" placeholder="Enter Password" />   
          </Form.Group>

          {signUpMode && (
            <Form.Group controlId="formConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control ref={confirmPasswordRef} type="password" placeholder="Confirm password" />
            </Form.Group>
          )}
          {error && (
            <div style={{ color: "red", marginTop: "0.5rem" }}>{error}</div>
          )}
          {success && (
            <div style={{ color: "green", marginTop: "0.5rem" }}>{success}</div>
          )}

          {/* if in sign-up mode, show only the submit button */ }
          <Row className="mt-4 justify-content-center"> 
            {signUpMode ? ( 
              <Col xs={8} className="d-flex justify-content-center">
                <Button
                  onClick={createAccount}
                  type="button"
                  className="btn-signup w-100"
                  style={{ maxWidth: "200px" }}>
                  Submit
                </Button>
              </Col>
            ) : (
              <>
                <Col xs={6}>
                  <Button onClick={createAccount} type="button" className="btn-signup w-100">
                    Sign Up
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button onClick={signInUser} type="button" variant="secondary" className="btn-signin w-100">
                    Sign In
                  </Button>
                </Col>
              </>
            )}
          </Row>

          {signUpMode && (
            <div style={{ marginTop: "1rem", fontSize: "0.95rem", color: "#555" }}>
              Enter your email, password and confirm your password then press <b>Submit</b> to create your account.
            </div>
          )}
        </Form>
      </Container>
    </>
  );
};

export default Login;