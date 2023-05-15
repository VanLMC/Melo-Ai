import { Paper } from "@mui/material";
import styled from "styled-components";

export const Container = styled.div`
  text-align: center;
  width: 1200px;
  padding-top: 50px;
  margin: 0 auto;
  height: 100vh;
`;

export const SvgContainer = styled.h1`
  width: 100%;
  height: 210px;
  position: relative;
  display: flex;
  justify-content: center;
`;

export const Logo = styled.img`
  height: 300px;
  width: 300px;
`;

export const Controls = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  width: 600px;
`;

export const PianoCanvasContainer = styled(Paper)`
  padding: 20px;
  width: 700px;
  margin-top: 20px;
  display: ${(props) => (props.show ? "block" : "none")};
`;

export const PianoRollButtonsContainer = styled.div`
  display: flex;
  margin-top: 20px;
`;
