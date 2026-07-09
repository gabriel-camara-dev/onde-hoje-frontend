export const EMAIL_NOT_VERIFIED_MESSAGE = 'Confirme seu email antes de entrar.'

const errorMessages: Record<string, string> = {
  'Active vote not found': 'Voce ainda não votou nesse lugar nessa data.',
  'Admin access required': 'Acesso permitido apenas para administradores.',
  'At least one field must be provided': 'Informe pelo menos um campo para atualizar.',
  'Authenticated user not found': 'Sessao invalida. Entre novamente.',
  'Avatar file is required': 'Envie uma imagem para o avatar.',
  'Avatar image is too large': 'A imagem do avatar e muito grande.',
  'Avatar must be a JPEG, PNG or WEBP image': 'O avatar deve ser uma imagem JPEG, PNG ou WEBP.',
  'Avatar not found': 'Avatar não encontrado.',
  'Avatar URL host is not allowed': 'A URL do avatar não e permitida.',
  'Avatar URL must use HTTPS': 'A URL do avatar precisa usar HTTPS.',
  'Blocked members cannot rejoin without moderator action':
    'Membros bloqueados não podem voltar sem acao de um moderador.',
  'Could not fetch avatar image': 'não foi possivel baixar a imagem do avatar.',
  'Could not invite member': 'não foi possivel convidar o membro.',
  'Could not remove member': 'não foi possivel remover o membro.',
  'Date must be today or up to one month in the future':
    'A data precisa ser hoje ou no maximo um mes no futuro.',
  'Email confirmation link not found or expired': 'Link de confirmacao invalido ou expirado.',
  'Email not verified': EMAIL_NOT_VERIFIED_MESSAGE,
  'Date range must be ordered and have at most 31 days':
    'O periodo precisa estar em ordem e ter no maximo 31 dias.',
  Forbidden: 'Voce não tem permissao para fazer isso.',
  'Friend request not found': 'Pedido de amizade não encontrado.',
  'Friendship is already accepted': 'Essa pessoa ja e sua amiga.',
  'Friendship is already blocked': 'Essa amizade esta bloqueada.',
  'Google OAuth is not configured': 'Login com Google ainda não foi configurado.',
  'Group not found': 'Grupo não encontrado.',
  'Group or member not found': 'Grupo ou membro não encontrado.',
  'Group or member request not found': 'Grupo ou pedido de membro não encontrado.',
  'Group or user not found': 'Grupo ou usuario não encontrado.',
  'Invalid avatar path': 'Caminho de avatar invalido.',
  'Invalid credentials': 'Email, username ou senha incorretos.',
  'Member request is not pending': 'Esse pedido de entrada não esta pendente.',
  'Only the account owner or an admin can delete this user':
    'Apenas o dono da conta ou um admin pode excluir esse usuario.',
  'Only the account owner or an admin can update this user':
    'Apenas o dono da conta ou um admin pode atualizar esse usuario.',
  'Only the group leader can accept members': 'Apenas o lider do grupo pode aceitar membros.',
  'Only the group owner can invite members': 'Apenas o dono do grupo pode convidar membros.',
  'Only the group owner can remove members': 'Apenas o dono do grupo pode remover membros.',
  'Password must contain at least one special character':
    'A senha precisa ter pelo menos um caractere especial.',
  'Password must contain at least one uppercase letter':
    'A senha precisa ter pelo menos uma letra maiuscula.',
  'Place or group not found': 'Lugar ou grupo não encontrado.',
  'Resource not found': 'Recurso não encontrado.',
  'Sessao expirada. Entre novamente.': 'Sessao expirada. Entre novamente.',
  'Too many login attempts. Try again later.':
    'Muitas tentativas de login. Tente novamente em instantes.',
  'User not found': 'Usuario não encontrado.',
  'User with same email already exists': 'Esse email ja esta em uso.',
  'User with same username already exists': 'Esse username ja esta em uso.',
  'Validation failed': 'Confira os campos informados.',
  'You can vote for at most 6 places per week': 'Voce atingiu o limite de 6 votos na semana.',
  'You can only mark "not going" on a place that already has votes':
    'Só da para marcar "não vou" em um lugar que ja tem votos.',
  'latitude and longitude are required when radiusKm is provided':
    'Latitude e longitude sao obrigatorias quando o raio e informado.',
}

const errorPatterns: Array<[RegExp, string]> = [
  [/^User with same email .*exists$/i, 'Esse email ja esta em uso.'],
  [/^User with same username .*exists$/i, 'Esse username ja esta em uso.'],
  [/^Expected .+$/i, 'Valor informado em formato invalido.'],
  [/^Invalid .+$/i, 'Valor informado invalido.'],
  [/^Required$/i, 'Campo obrigatorio.'],
  [/^Too small:/i, 'O valor informado e muito curto.'],
  [/^Too big:/i, 'O valor informado e muito grande.'],
  [/^Invalid input:/i, 'Valor informado invalido.'],
  [/^Invalid enum value/i, 'Opcao informada invalida.'],
  [/^Vote limit exceeded/i, 'Voce atingiu o limite de votos da semana.'],
  [
    /^You can vote (?:in|for) at most (\d+) places per (?:day|week)$/i,
    'Voce atingiu o limite de $1 votos na semana.',
  ],
]

export function translateErrorMessage(message: string, status?: number) {
  const trimmedMessage = message.trim()

  if (errorMessages[trimmedMessage]) {
    return errorMessages[trimmedMessage]
  }

  for (const [pattern, translation] of errorPatterns) {
    if (pattern.test(trimmedMessage)) {
      return trimmedMessage.replace(pattern, translation)
    }
  }

  if (status === 400) {
    return 'Confira os dados informados e tente novamente.'
  }

  if (status === 401) {
    return 'Sessao expirada. Entre novamente.'
  }

  if (status === 403) {
    return 'Voce não tem permissao para fazer isso.'
  }

  if (status === 404) {
    return 'não encontramos o que voce procurou.'
  }

  if (status === 409) {
    return 'não foi possivel concluir essa acao agora. Atualize os dados e tente novamente.'
  }

  if (status === 429) {
    return 'Muitas tentativas. Tente novamente em instantes.'
  }

  if (status && status >= 500) {
    return 'Erro interno no servidor. Tente novamente em instantes.'
  }

  return trimmedMessage
}

export function translateApiMessage(message: string | string[], status?: number) {
  if (Array.isArray(message)) {
    return message.map((item) => translateErrorMessage(item, status)).join(', ')
  }

  return translateErrorMessage(message, status)
}