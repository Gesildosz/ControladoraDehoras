"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Clock, User, AlertTriangle, CheckCircle, Calendar } from "lucide-react"

type AuthStep = "badge" | "code" | "dashboard" | "blocked"

interface Colaborador {
  id: number
  nome: string
  cracha: string
  cargo?: string
  supervisor?: string
  turno?: string
  telefone?: string
  dataNascimento?: string
}

interface HoraLancamento {
  id: number
  data_lancamento: string
  horas: number
  motivo: string
  criado_por: string
}

interface SolicitacaoFolga {
  id: number
  data_folga: string
  horas_debitadas: number
  motivo?: string
  status: "pendente" | "aprovada" | "recusada"
  data_solicitacao: string
  dia_semana: string
}

export default function HomePage() {
  const [step, setStep] = useState<AuthStep>("badge")
  const [cracha, setCracha] = useState("")
  const [codigo, setCodigo] = useState("")
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [colaboradorInfo, setColaboradorInfo] = useState<Colaborador | null>(null)
  const [saldo, setSaldo] = useState(0)
  const [historico, setHistorico] = useState<HoraLancamento[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState("")

  const [dataFolga, setDataFolga] = useState("")
  const [motivoFolga, setMotivoFolga] = useState("")
  const [solicitacoesFolga, setSolicitacoesFolga] = useState<SolicitacaoFolga[]>([])
  const [loadingFolga, setLoadingFolga] = useState(false)

  const verificarCracha = async () => {
    if (!cracha.trim()) {
      setError("Digite o número do crachá")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/verifica-cracha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cracha: cracha.trim() }),
      })

      const data = await response.json()

      if (data.ok) {
        setColaborador({ id: data.colaboradorId, nome: data.nome, cracha })
        setStep("code")
      } else {
        setError(data.error || "Crachá não encontrado")
      }
    } catch (err) {
      setError("Erro ao verificar crachá. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const verificarCodigo = async () => {
    if (!codigo.trim()) {
      setError("Digite o código de acesso")
      return
    }

    if (!colaborador) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/verifica-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          codigoAcesso: codigo.trim(),
        }),
      })

      const data = await response.json()

      if (data.ok) {
        await carregarDados()
        setStep("dashboard")
      } else {
        setError(data.error || "Código incorreto")
        if (data.token) {
          setToken(data.token)
          setStep("blocked")
        }
      }
    } catch (err) {
      setError("Erro ao verificar código. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const carregarDados = async () => {
    if (!colaborador) return

    try {
      const response = await fetch(`/api/colaborador/${colaborador.id}/banco`)
      const data = await response.json()
      setColaboradorInfo(data.colaborador)
      setSaldo(data.saldo || 0)
      setHistorico(data.historico || [])

      await carregarSolicitacoesFolga()
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  const carregarSolicitacoesFolga = async () => {
    if (!colaborador) return

    try {
      const response = await fetch(`/api/colaborador/${colaborador.id}/folgas`)
      const data = await response.json()
      setSolicitacoesFolga(data.solicitacoes || [])
    } catch (err) {
      console.error("Erro ao carregar solicitações de folga:", err)
    }
  }

  const calcularHorasDebito = (data: string) => {
    const date = new Date(data)
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 6 ? 4 : 8 // Saturday = 4h, others = 8h
  }

  const obterNomeDia = (data: string) => {
    const date = new Date(data)
    const dias = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
    return dias[date.getDay()]
  }

  const solicitarFolga = async () => {
    if (!dataFolga) {
      setError("Selecione a data da folga")
      return
    }

    if (!colaborador) return

    const horasDebito = calcularHorasDebito(dataFolga)

    if (saldo < horasDebito) {
      setError(`Saldo insuficiente. Necessário ${horasDebito}h, disponível ${saldo}h`)
      return
    }

    setLoadingFolga(true)
    setError("")

    try {
      const response = await fetch("/api/colaborador/solicitar-folga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: colaborador.id,
          dataFolga,
          motivo: motivoFolga.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setDataFolga("")
        setMotivoFolga("")
        await carregarDados()
        alert("Solicitação de folga enviada com sucesso!")
      } else {
        setError(data.error || "Erro ao solicitar folga")
      }
    } catch (err) {
      setError("Erro ao solicitar folga. Tente novamente.")
    } finally {
      setLoadingFolga(false)
    }
  }

  const reiniciar = () => {
    setStep("badge")
    setCracha("")
    setCodigo("")
    setColaborador(null)
    setColaboradorInfo(null)
    setSaldo(0)
    setHistorico([])
    setError("")
    setToken("")
    setDataFolga("")
    setMotivoFolga("")
    setSolicitacoesFolga([])
  }

  const formatarHoras = (horas: number) => {
    const sinal = horas >= 0 ? "+" : ""
    return `${sinal}${horas}h`
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aprovada":
        return "default"
      case "recusada":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "aprovada":
        return "Aprovada"
      case "recusada":
        return "Recusada"
      default:
        return "Pendente"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Banco de Horas</h1>
          <p className="text-gray-600">Sistema de controle de horas trabalhadas</p>
        </div>

        {/* Step 1: Badge Verification */}
        {step === "badge" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Identificação
              </CardTitle>
              <CardDescription>Digite o número do seu crachá para continuar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cracha">Número do Crachá</Label>
                <Input
                  id="cracha"
                  type="text"
                  placeholder="Ex: 001"
                  value={cracha}
                  onChange={(e) => setCracha(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && verificarCracha()}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={verificarCracha} className="w-full" disabled={loading}>
                {loading ? "Verificando..." : "Continuar"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Code Verification */}
        {step === "code" && colaborador && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Olá, {colaborador.nome}
              </CardTitle>
              <CardDescription>Digite seu código de acesso para entrar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código de Acesso</Label>
                <Input
                  id="codigo"
                  type="password"
                  placeholder="Digite seu código"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && verificarCodigo()}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={reiniciar} className="flex-1 bg-transparent">
                  Voltar
                </Button>
                <Button onClick={verificarCodigo} className="flex-1" disabled={loading}>
                  {loading ? "Verificando..." : "Entrar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Blocked */}
        {step === "blocked" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Acesso Bloqueado
              </CardTitle>
              <CardDescription>Muitas tentativas incorretas. Procure o administrador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Token de desbloqueio:</strong>
                </p>
                <div className="bg-white p-2 rounded border font-mono text-lg text-center">{token}</div>
                <p className="text-xs text-red-600 mt-2">
                  Informe este token ao administrador para desbloquear seu acesso
                </p>
              </div>

              <Button variant="outline" onClick={reiniciar} className="w-full bg-transparent">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Dashboard */}
        {step === "dashboard" && colaborador && (
          <div className="space-y-4">
            {colaboradorInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nome Completo:</span>
                      <span className="font-medium">{colaboradorInfo.nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crachá:</span>
                      <span className="font-medium">{colaboradorInfo.cracha}</span>
                    </div>
                    {colaboradorInfo.cargo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cargo:</span>
                        <span className="font-medium">{colaboradorInfo.cargo}</span>
                      </div>
                    )}
                    {colaboradorInfo.supervisor && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supervisor:</span>
                        <span className="font-medium">{colaboradorInfo.supervisor}</span>
                      </div>
                    )}
                    {colaboradorInfo.turno && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Turno:</span>
                        <span className="font-medium">{colaboradorInfo.turno}</span>
                      </div>
                    )}
                    {colaboradorInfo.telefone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Telefone:</span>
                        <span className="font-medium">{colaboradorInfo.telefone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Saldo de Horas</span>
                  <Badge variant="outline">Crachá {colaborador.cracha}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Saldo Atual</p>
                  <p className={`text-3xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatarHoras(saldo)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {saldo >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Agendamento de Folga
                  </CardTitle>
                  <CardDescription>Solicite folgas utilizando seu banco de horas positivo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataFolga">Data da Folga</Label>
                    <Input
                      id="dataFolga"
                      type="date"
                      value={dataFolga}
                      onChange={(e) => setDataFolga(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                    {dataFolga && (
                      <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                        <p>
                          <strong>{obterNomeDia(dataFolga)}</strong>
                        </p>
                        <p>
                          Horas a debitar: <strong>{calcularHorasDebito(dataFolga)}h</strong>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motivoFolga">Motivo (opcional)</Label>
                    <Input
                      id="motivoFolga"
                      type="text"
                      placeholder="Ex: Consulta médica, assuntos pessoais..."
                      value={motivoFolga}
                      onChange={(e) => setMotivoFolga(e.target.value)}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button onClick={solicitarFolga} className="w-full" disabled={loadingFolga || !dataFolga}>
                    {loadingFolga ? "Enviando..." : "Solicitar Folga"}
                  </Button>

                  {solicitacoesFolga.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Minhas Solicitações</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {solicitacoesFolga.map((solicitacao) => (
                          <div
                            key={solicitacao.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")} -{" "}
                                {solicitacao.dia_semana}
                              </p>
                              <p className="text-xs text-gray-600">
                                {solicitacao.horas_debitadas}h •{" "}
                                {new Date(solicitacao.data_solicitacao).toLocaleDateString("pt-BR")}
                              </p>
                              {solicitacao.motivo && <p className="text-xs text-gray-500 mt-1">{solicitacao.motivo}</p>}
                            </div>
                            <Badge variant={getStatusColor(solicitacao.status)}>
                              {getStatusText(solicitacao.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Lançamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Nenhum lançamento encontrado</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {historico.map((item) => (
                      <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{formatarData(item.data_lancamento)}</p>
                          {item.motivo && <p className="text-sm text-gray-800 mt-1">{item.motivo}</p>}
                          <p className="text-xs text-gray-500 mt-1">Por: {item.criado_por}</p>
                        </div>
                        <Badge variant={item.horas >= 0 ? "default" : "destructive"} className="ml-2">
                          {formatarHoras(item.horas)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Button variant="outline" onClick={reiniciar} className="w-full bg-transparent">
              Sair
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
