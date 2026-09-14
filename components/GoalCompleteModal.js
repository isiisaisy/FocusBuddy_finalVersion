import MotivationCard from "./MotivationCard";

export default function GoalCompleteModal({ goal, visible, onClose }) {
  const text = goal
    ? `Gratuliere du hast dein Ziel "${goal.title}" erreicht. Du hast dir deine Belohnung "${goal.reward || ""}" hart verdient!`
    : "";

  return (
    <MotivationCard
      visible={visible}
      imageSource={require("../assets/perfect.png")}
      eyebrow="ZIEL ERREICHT"
      buttonText="WEITER"
      text={text}
      onClose={onClose}
    />
  );
}
