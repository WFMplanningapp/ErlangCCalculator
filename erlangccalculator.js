import React, { useState } from 'react';
import { erlangC } from 'erlang-c-js';

const ErlangCalculator = () => {
  // Phone inputs
  const [phoneArrivalRate, setPhoneArrivalRate] = useState(0);
  const [phoneServiceRate, setPhoneServiceRate] = useState(0);
  const [phoneServiceLevel, setPhoneServiceLevel] = useState(80);
  const [phoneTargetTime, setPhoneTargetTime] = useState(20);
  const [phoneArrivalPattern, setPhoneArrivalPattern] = useState(Array(336).fill(0));

  // Email inputs
  const [emailArrivalRate, setEmailArrivalRate] = useState(0);
  const [emailServiceRate, setEmailServiceRate] = useState(0);
  const [emailServiceLevel, setEmailServiceLevel] = useState(80);
  const [emailTargetTime, setEmailTargetTime] = useState(3600); // Response time in seconds for email
  const [emailArrivalPattern, setEmailArrivalPattern] = useState(Array(336).fill(0));

  // Chat inputs
  const [chatArrivalRate, setChatArrivalRate] = useState(0);
  const [chatServiceRate, setChatServiceRate] = useState(0);
  const [chatServiceLevel, setChatServiceLevel] = useState(80);
  const [chatTargetTime, setChatTargetTime] = useState(60); // Target for chat in seconds
  const [chatArrivalPattern, setChatArrivalPattern] = useState(Array(336).fill(0));

  const [agentsNeeded, setAgentsNeeded] = useState([]);
  const [occupancy, setOccupancy] = useState(null);

  const handlePatternChange = (channel, index, value) => {
    let newPattern;
    switch (channel) {
      case 'phone':
        newPattern = [...phoneArrivalPattern];
        newPattern[index] = value;
        setPhoneArrivalPattern(newPattern);
        break;
      case 'email':
        newPattern = [...emailArrivalPattern];
        newPattern[index] = value;
        setEmailArrivalPattern(newPattern);
        break;
      case 'chat':
        newPattern = [...chatArrivalPattern];
        newPattern[index] = value;
        setChatArrivalPattern(newPattern);
        break;
      default:
        break;
    }
  };

  const calculateAgents = () => {
    // Calculate separately for each channel (Phone, Email, Chat) and then blend
    const phoneAgents = calculateChannelAgents(phoneArrivalRate, phoneServiceRate, phoneServiceLevel, phoneTargetTime, phoneArrivalPattern);
    const emailAgents = calculateChannelAgents(emailArrivalRate, emailServiceRate, emailServiceLevel, emailTargetTime, emailArrivalPattern);
    const chatAgents = calculateChannelAgents(chatArrivalRate, chatServiceRate, chatServiceLevel, chatTargetTime, chatArrivalPattern);

    // Logic to blend agents for channels (could involve multitasking factors, etc.)
    const totalAgents = blendAgents([phoneAgents, emailAgents, chatAgents]);

    setAgentsNeeded(totalAgents);
  };

  const calculateChannelAgents = (arrivalRate, serviceRate, serviceLevel, targetTime, arrivalPattern) => {
    let totalAgents = 0;
    let totalOccupancy = 0;

    // Loop through intervals for this channel
    for (let i = 0; i < arrivalPattern.length; i++) {
      const intervalPercentage = arrivalPattern[i] / 100;
      const arrivalRatePerInterval = (arrivalRate * intervalPercentage) / (336 / 2); // Convert weekly rate to 30-min intervals
      const serviceRatePerHour = serviceRate / (336 / 2); // Service rate per interval

      let agents = 1;
      let currentServiceLevel = 0;

      while (currentServiceLevel < serviceLevel / 100) {
        const result = erlangC(arrivalRatePerInterval * 2, serviceRatePerHour, agents); // Erlang C for hourly rate
        const probabilityAnsweredWithinTime = Math.exp(-targetTime / result.waitingTime);
        currentServiceLevel = probabilityAnsweredWithinTime;

        if (currentServiceLevel >= serviceLevel / 100) {
          break;
        }
        agents++;
      }

      totalAgents += agents;
      const intervalOccupancy = (arrivalRatePerInterval / (agents * (serviceRatePerHour / 2))) * 100;
      totalOccupancy += intervalOccupancy;
    }

    return { totalAgents, totalOccupancy: totalOccupancy / arrivalPattern.length };
  };

  const blendAgents = (channels) => {
    // Summing agents across channels for simplicity (you could add multitasking factors here)
    return channels.reduce((acc, channel) => acc + channel.totalAgents, 0);
  };

  return (
    <div>
      <h1>Erlang C Agent and Occupancy Calculator for Blended Channels</h1>

      <h2>Phone Channel</h2>
      <input
        type="number"
        placeholder="Weekly Call Arrival Rate"
        onChange={(e) => setPhoneArrivalRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Weekly Service Rate"
        onChange={(e) => setPhoneServiceRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Desired Service Level (%)"
        onChange={(e) => setPhoneServiceLevel(e.target.value)}
        value={phoneServiceLevel}
      />
      <input
        type="number"
        placeholder="Target Response Time (seconds)"
        onChange={(e) => setPhoneTargetTime(e.target.value)}
        value={phoneTargetTime}
      />
      <h3>Phone Call Arrival Pattern</h3>
      {Array.from({ length: 336 }).map((_, index) => (
        <input
          key={index}
          type="number"
          placeholder={`Interval ${index + 1}`}
          value={phoneArrivalPattern[index]}
          onChange={(e) => handlePatternChange('phone', index, e.target.value)}
        />
      ))}

      <h2>Email Channel</h2>
      <input
        type="number"
        placeholder="Weekly Email Arrival Rate"
        onChange={(e) => setEmailArrivalRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Weekly Email Service Rate"
        onChange={(e) => setEmailServiceRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Desired Email Service Level (%)"
        onChange={(e) => setEmailServiceLevel(e.target.value)}
        value={emailServiceLevel}
      />
      <input
        type="number"
        placeholder="Email Response Time (seconds)"
        onChange={(e) => setEmailTargetTime(e.target.value)}
        value={emailTargetTime}
      />
      <h3>Email Arrival Pattern</h3>
      {Array.from({ length: 336 }).map((_, index) => (
        <input
          key={index}
          type="number"
          placeholder={`Interval ${index + 1}`}
          value={emailArrivalPattern[index]}
          onChange={(e) => handlePatternChange('email', index, e.target.value)}
        />
      ))}

      <h2>Chat Channel</h2>
      <input
        type="number"
        placeholder="Weekly Chat Arrival Rate"
        onChange={(e) => setChatArrivalRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Weekly Chat Service Rate"
        onChange={(e) => setChatServiceRate(e.target.value)}
      />
      <input
        type="number"
        placeholder="Desired Chat Service Level (%)"
        onChange={(e) => setChatServiceLevel(e.target.value)}
        value={chatServiceLevel}
      />
      <input
        type="number"
        placeholder="Chat Response Time (seconds)"
        onChange={(e) => setChatTargetTime(e.target.value)}
        value={chatTargetTime}
      />
      <h3>Chat Arrival Pattern</h3>
      {Array.from({ length: 336 }).map((_, index) => (
        <input
          key={index}
          type="number"
          placeholder={`Interval ${index + 1}`}
          value={chatArrivalPattern[index]}
          onChange={(e) => handlePatternChange('chat', index, e.target.value)}
        />
      ))}

      <button onClick={calculateAgents}>Calculate Agents & Occupancy</button>

      {agentsNeeded.length > 0 && (
        <div>
          <h3>Total Agents Required: {agentsNeeded}</h3>
        </div>
      )}
    </div>
  );
};

export default ErlangCalculator;
