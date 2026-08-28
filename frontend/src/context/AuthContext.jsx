import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { cognitoConfig } from "../aws-config";

const userPool = new CognitoUserPool(cognitoConfig);
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on page load if a valid Cognito session exists.
  useEffect(() => {
    const current = userPool.getCurrentUser();
    if (!current) {
      setLoading(false);
      return;
    }
    current.getSession((err, session) => {
      if (err || !session?.isValid()) {
        setLoading(false);
        return;
      }
      setUser({ username: current.getUsername() });
      setAccessToken(session.getAccessToken().getJwtToken());
      setLoading(false);
    });
  }, []);

  const signUp = useCallback(
    (email, password, fullName) =>
      new Promise((resolve, reject) => {
        const attributes = [
          new CognitoUserAttribute({ Name: "email", Value: email }),
          new CognitoUserAttribute({ Name: "name", Value: fullName }),
        ];
        userPool.signUp(email, password, attributes, null, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }),
    []
  );

  const confirmSignUp = useCallback(
    (email, code) =>
      new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
        cognitoUser.confirmRegistration(code, true, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      }),
    []
  );

  const signIn = useCallback(
    (email, password) =>
      new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
        const authDetails = new AuthenticationDetails({ Username: email, Password: password });

        cognitoUser.authenticateUser(authDetails, {
          onSuccess: (session) => {
            setUser({ username: email });
            setAccessToken(session.getAccessToken().getJwtToken());
            resolve(session);
          },
          onFailure: (err) => reject(err),
          // Cognito forces a password reset on first admin-created login
          newPasswordRequired: () => reject(new Error("New password required")),
        });
      }),
    []
  );

  const signOut = useCallback(() => {
    const current = userPool.getCurrentUser();
    if (current) current.signOut();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = { user, accessToken, loading, signUp, confirmSignUp, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
