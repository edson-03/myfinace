function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function calcHealthScore(params: {
  taxaPoupanca: number;
  indiceEndividamento: number;
  percentualInvestido: number;
  reservaAtual: number;
  reservaIdeal: number;
  totalAplicado: number;
  totalAtualInvestido: number;
}) {
  const scorePoupanca = clamp((params.taxaPoupanca / 0.3) * 100);
  const scoreDivida = clamp(100 - params.indiceEndividamento * 100);
  const scoreInvestido = clamp((params.percentualInvestido / 0.2) * 100);
  const scoreReserva =
    params.reservaIdeal > 0 ? clamp((params.reservaAtual / params.reservaIdeal) * 100) : 0;
  const crescimento =
    params.totalAplicado > 0
      ? (params.totalAtualInvestido - params.totalAplicado) / params.totalAplicado
      : 0;
  const scoreCrescimento = clamp(50 + crescimento * 100);

  const score = Math.round(
    (scorePoupanca + scoreDivida + scoreInvestido + scoreReserva + scoreCrescimento) / 5,
  );

  return { score, scorePoupanca, scoreDivida, scoreInvestido, scoreReserva, scoreCrescimento };
}

export function scoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Regular";
  return "Atenção";
}
