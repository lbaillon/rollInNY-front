import React, { createContext, useContext, useState } from "react";

/*
Provider explications :

Ce provider permet de gérer les pop-ups et le mode Plan My Day dans toute l'application.
Il possède deux contextes : PopupContext et PlanDayContext.

Dans le App.js, le provider est appelé et englobe toute l'application.

Ci-dessous, la partie return() indique que le PopupContext.Provider englobe le PlanDayContext.Provider qui englobe lui-même les enfants de AppProvider.
*/

// Contexte pour gérer les pop-ups et le mode PlanMyDay
const PopupContext = createContext();
const PlanDayContext = createContext();

export const AppProvider = ({ children }) => {
  const [activePopupId, setActivePopupId] = useState(null); // Pour les pop-ups
  const [isPlanDay, setIsPlanDay] = useState(false); // Pour le mode Plan My Day

  return (
    <PopupContext.Provider value={{ activePopupId, setActivePopupId }}>
      <PlanDayContext.Provider value={{ isPlanDay, setIsPlanDay }}>
        {children}
      </PlanDayContext.Provider>
    </PopupContext.Provider>
  );
};

export const usePopupContext = () => useContext(PopupContext); // Hook pour le contexte des pop-ups
export const usePlanDayContext = () => useContext(PlanDayContext); // Hook pour le contexte du mode Plan My Day