import { useState } from "react"
import "./../App.css"
import { useNavigate } from "react-router-dom"

function Home() {
  const [blind, setBlind] = useState(false)
  const [selectedMode, setSelectedMode] = useState(null)
  const navi = useNavigate()

  const handlemode = (mode) => {
    setSelectedMode(mode)
    setBlind(true)
  }

  return (
    <div className="welcome" style={{ minHeight: '45vh' }}>
      <div style={{ fontSize: "3.5rem", fontWeight: "bold", color: "#2c3e50" }}>Welcome to Chess Game</div>
      
      {!blind && <>
        <div></div>
        <div className="button" onClick={() => handlemode(1)}>Vs Computer</div>
        <div className="button" onClick={() => handlemode(2)}>Two Player</div>
      </>}
      {blind && 
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>Want to Play Blind Mode?</div>
          <div style={{ display: "flex", gap: "2rem", justifyContent: "center" }}>
            <div className="button" onClick={() => navi('/game', { state: { mode: selectedMode, blind: true } })}>Yes</div>
            <div className="button" onClick={() => navi('/game', { state: { mode: selectedMode, blind: false } })}>No</div>
          </div>
        </div>
      }
    </div>
  )
}

export default Home
