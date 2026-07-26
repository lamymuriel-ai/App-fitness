import { useNavigate } from 'react-router-dom'

export default function AideMemoire() {
  const navigate = useNavigate()

  return (
    <div className="screen">
      <button className="btn-ghost btn" onClick={() => navigate(-1)}>← Retour</button>
      <h1>📝 Aide-mémoire</h1>
      <p className="muted">Quelques rappels utiles, à consulter à tout moment.</p>

      <div className="card blue">
        <h3>🏋️ Comment trouver son poids de départ sur une machine ?</h3>
        <p>
          Règle la charge au minimum et fais une première série d'essai. Vérifie que ta posture
          est correcte avant d'augmenter. Le bon poids est celui qui rend les 2 dernières
          répétitions de la dernière série difficiles mais réalisables avec une bonne technique.
        </p>
        <p className="mb-0">
          N'hésite pas à ajuster la charge en cours de séance si c'est trop facile ou trop dur —
          note le poids retenu, l'appli le mémorise pour la prochaine fois.
        </p>
      </div>

      <div className="card yellow">
        <h3>🔁 Séries à la suite ou circuit : quelle différence ?</h3>
        <p>
          Dans ce programme, on travaille <strong>exercice par exercice</strong> : tu fais les 3
          séries d'un même mouvement (avec un repos de 60 à 90 secondes entre chaque série), puis
          tu passes à l'exercice suivant.
        </p>
        <p className="mb-0">
          Ce n'est <strong>pas un circuit</strong>, qui consisterait à enchaîner plusieurs
          exercices différents sans repos avant de refaire un tour. Travailler exercice par
          exercice permet de mieux maîtriser la charge et la technique.
        </p>
      </div>

      <div className="card pink">
        <h3>⚠️ Erreurs fréquentes à éviter</h3>
        <ul style={{ paddingLeft: 20 }}>
          <li>Sauter l'échauffement avant la séance.</li>
          <li>Se peser tous les jours et réagir à chaque variation — regarde plutôt la moyenne sur 7 jours.</li>
          <li>Comparer sa progression à celle des autres : chaque corps évolue à son rythme.</li>
          <li>Négliger l'hydratation, surtout les jours de sport.</li>
          <li>Oublier les fibres et les protéines au profit des seules calories.</li>
          <li>Continuer un exercice avec une mauvaise posture par fatigue — mieux vaut réduire la charge.</li>
          <li>Vouloir tout changer d'un coup (calories ET pas) en cas de stagnation — un seul levier à la fois.</li>
        </ul>
      </div>

      <div className="card">
        <h3>💛 À propos des notes santé</h3>
        <p className="mb-0">
          L'espace "notes santé" de ton profil sert uniquement à garder une trace factuelle pour
          toi. L'application ne pose aucun diagnostic et ne donne aucun conseil médical. En cas de
          doute ou de signal inhabituel (fatigue extrême, perte de poids très rapide, malaise…),
          parles-en à un professionnel de santé.
        </p>
      </div>
    </div>
  )
}
