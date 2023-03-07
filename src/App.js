import Button from "react-bootstrap/Button";
import CardGroup from "react-bootstrap/CardGroup";
import Card from "react-bootstrap/Card";
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  // Is the user logged in?
  const [loggedIn, setLoggedIn] = useState(false);
  // Data about the user from the query to GitHub 
  const [user, setUser] = useState(null);
  // The authrequest URL. Use state so we know when it is set to update the page.
  const [authRequestUrl, setAuthRequestUrl] = useState(null);
  // If processing error, we will update the page as such.
  const [processingError, setProcessingError] = useState(null);

  // Run once...
  useEffect(() => {
    // Grab the access_token from the query params if it exists.
    const token = new URLSearchParams(window.location.search).get(
      "access_token"
    );

    // axios app query a proxy request and grab user data. This it to prevent CORS issues. Requires a proxy service like LCP running like this:
    // lcp --proxyUrl https://api.github.com/
    // CORS comes into play when a server redirects a browser to another server. Since it is the application that is making the reqeust, there is no CORS violation here. If the destination service "api.github.com" knew about this redirect from the request of the code request, it could permit the browser to circumvent SOP (same origin policy) but it does not and thus the browser will refuse to accept the request. The only option then is to proxy this request from the application and not in the browser.

    axios
      .get("http://localhost:8010/proxy/user", {
        headers: {
          Authorization: "token " + token,
        },
      })
      .then((res) => {
        console.log(res);
        setUser(res.data);
        setLoggedIn(true);
      })
      .catch((error) => {
        console.log("error " + error);
      });

    getAuthReqUrl();
  }, []);

  const revoke_token = () => {
    const CLIENT_ID = "429fd9dacea61485f9ba";
    const CLIENT_SECRET = "340299a003c42c9bcad8fa28a0db58388b0218e5";
    const TOKEN = new URLSearchParams(window.location.search).get(
      "access_token"
    );
    axios({
      method: "DELETE",
      auth: { username: CLIENT_ID, password: CLIENT_SECRET },
      data: `{"access_token": "${TOKEN}"}`,
      url: `https://api.github.com/applications/${CLIENT_ID}/token`,
      headers: {
        Accept: "application/vnd.github+json",
      },
    })
      .then(() => {
        console.log("Successfully logged out");
        setLoggedIn(false);
      })
      .catch((e) => {
        console.log((e) => {
          setProcessingError(e);
        });
      });
  };

  // Instead of storing the authentication request URL statically here, I added it to the server to provide during runtime.
  const getAuthReqUrl = async () => {
    await axios
      .get("http://localhost:8080/api/returnAccessUrl")
      .then((result) => setAuthRequestUrl(result.request.response))
      .catch((e) => setProcessingError(e));
  };

  function SuccessPage() {
    return (
      <>
        <h1>Success!</h1>
        <p>You are logged into Clio!</p>

        <CardGroup>
          {
            <Card style={{ maxWidth: "25%", margin: "auto" }}>
              <Card.Img variant="top" src={user.avatar_url} />
              <Card.Body>
                <Card.Title>{user.name}</Card.Title>
                <Card.Text>{user.bio}</Card.Text>
                <Button variant="primary" target="_blank" href={user.html_url}>
                  GitHub Profile
                </Button>
              </Card.Body>
            </Card>
          }
        </CardGroup>
        <h1 className="h3 mb-3 font-weight-normal">Sign in with GitHub</h1>
        <Button
          type="primary"
          className="btn"
          size="lg"
          onClick={() => {
            revoke_token();
          }}
        >
          Logout
        </Button>
      </>
    );
  }

  function LoginPage() {
    return (
      <>
        {/* <img
      className="mb-4"
      src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
      width="150"
    ></img> */}
        <h1 className="h3 mb-3 font-weight-normal">
          Sign in with your Clio Login
        </h1>
        <Button
          type="primary"
          className="btn"
          size="lg"
          // href="https://github.com/login/oauth/authorize?client_id=429fd9dacea61485f9ba&redirect_uri=http://localhost:8080/oauth/redirect"
          href={authRequestUrl}
        >
          Sign in
        </Button>
      </>
    );
  }

  return (
    <div className="App text-center container-fluid">
      {processingError ? (
        <>
          <h1>Error</h1>
          <h3>There was an error. Please contact the administrator.</h3>
          <p>{processingError.message}</p>
        </>
      ) : !authRequestUrl ? (
        <>
          <h3>Loading...</h3>
        </>
      ) : !loggedIn ? (
        <LoginPage />
      ) : (
        <SuccessPage />
      )}
    </div>
  );
}

export default App;
