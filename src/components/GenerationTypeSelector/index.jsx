import * as React from "react";
import Radio from "@mui/material/Radio";
import { Typography } from "@mui/material";
import { RadioGroup } from "./styles";

export default function GemerationTypeSelector({
  generationType,
  setGenerationType,
}) {
  return (
    <div>
      <Typography variant="h6" color="#fff" fontWeight={"bold"} mb={3}>
        Generate Melody Based on
      </Typography>

      <RadioGroup
        row
        value={generationType}
        onChange={(e) => setGenerationType(e.target.value)}
      >
        <div>
          <Typography variant="caption" color="#fff" fontWeight={"bold"} mb={3}>
            Based on existing artists
          </Typography>
          <Radio value="artists" />
        </div>
        <div>
          <Typography variant="caption" color="#fff" fontWeight={"bold"} mb={3}>
            Based on pure AI model
          </Typography>
          <Radio value="pure-ai" />
        </div>
      </RadioGroup>
    </div>
  );
}
