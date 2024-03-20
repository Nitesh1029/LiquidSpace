import { Center } from "@chakra-ui/react";
import React from "react";
import FormContainer from "./components/FormContainer";
import { StepProvider } from "./context/StepCountContext";


function App() {
  return (
    <Center minH="100vh" backgroundColor={"black"}>
      <StepProvider>
      <FormContainer />
      <NewForm />
      </StepProvider>
    </Center>
  );
}
export default App;
