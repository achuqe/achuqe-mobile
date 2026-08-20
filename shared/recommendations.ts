import type { GiftAnswers, GiftProduct, RankedGift } from "./achuqe";

const occasionLabels = {
  birthday: "დაბადების დღისთვის",
  wedding: "ქორწილისთვის",
  engagement: "ნიშნობისთვის",
  anniversary: "იუბილესთვის",
  housewarming: "ახალი სახლისთვის",
  newBaby: "ოჯახის ახალი წევრისთვის",
} as const;

export function rankGiftProducts(products: GiftProduct[], answers: GiftAnswers): RankedGift[] {
  return products
    .filter((product) => product.status === "active" && product.price <= answers.maxBudget)
    .map((product) => {
      let score = 0;
      const matchReasons: string[] = [];

      if (answers.occasion && product.occasions.includes(answers.occasion)) {
        score += 25;
        matchReasons.push(`შესანიშნავია ${occasionLabels[answers.occasion]}`);
      }
      if (answers.ageRange && product.ageRanges.includes(answers.ageRange)) {
        score += 15;
        matchReasons.push("შეესაბამება არჩეულ ასაკს");
      }
      if (answers.gender && (product.genders.includes(answers.gender) || product.genders.includes("any"))) {
        score += 12;
      }
      if (answers.relationship && product.relationships.includes(answers.relationship)) {
        score += 13;
        matchReasons.push("კარგი არჩევანია თქვენი ურთიერთობისთვის");
      }

      const interestMatches = answers.interests.filter((interest) => product.interests.includes(interest));
      if (answers.interests.length === 0) {
        score += 12;
      } else if (interestMatches.length > 0) {
        score += Math.min(25, interestMatches.length * 12.5);
        matchReasons.push(
          interestMatches.length > 1
            ? `${interestMatches.length} არჩეულ ინტერესს ემთხვევა`
            : "ერთ-ერთ მთავარ ინტერესს ემთხვევა",
        );
      }

      if (product.price >= answers.minBudget && product.price <= answers.maxBudget) {
        score += 10;
        matchReasons.unshift("ზუსტად თქვენს ბიუჯეტშია");
      } else {
        score += 5;
      }

      return {
        ...product,
        score: Math.min(100, Math.round(score)),
        matchReasons: matchReasons.slice(0, 3),
      };
    })
    .sort((a, b) => b.score - a.score || a.price - b.price);
}
