"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Clock, UserPlus, AlertTriangle, CheckCircle, Unlock, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface Colaborador {
  id: number
  nome: string
  cracha: string
  bloqueado: boolean
  tentativas_codigo: number
  ultimo_token_bloqueio?: string
  dataNascimento: string
  cargo: string
  supervisor: string
  turno: string
  telefone: string
}

interface HoraLancamento {
  id: number
  colaborador_id: number
  colaborador_nome: string
  data_lancamento: string
  horas: number
  motivo: string
  criado_por: string
}

interface SolicitacaoFolga {
  id: number
  colaborador_id: number
  colaborador_nome: string
  colaborador_cracha: string
  data_folga: string
  dia_semana: string
  horas_debitar: number
  motivo: string
  status: string
  data_solicitacao: string
  data_processamento?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [historico, setHistorico] = useState<HoraLancamento[]>([])
  const [solicitacoesFolga, setSolicitacoesFolga] = useState<SolicitacaoFolga[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form states
  const [novoColaborador, setNovoColaborador] = useState({
    nome: "",
    cracha: "",
    codigoAcesso: "",
    dataNascimento: "",
    cargo: "",
    supervisor: "",
    turno: "",
    telefone: "+55 ",
  })

  const [lancamentoHoras, setLancamentoHoras] = useState({
    colaboradorId: "",
    horas: "",
    motivo: "",
    criadoPor: "Administrador",
  })

  const [tokenDesbloqueio, setTokenDesbloqueio] = useState({
    token: "",
    novoCodigoAcesso: "",
  })

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      const [colaboradoresRes, historicoRes, folgasRes] = await Promise.all([
        fetch("/api/admin/colaboradores"),
        fetch("/api/admin/historico"),
        fetch("/api/admin/folgas"),
      ])

      if (colaboradoresRes.ok) {
        const colaboradoresData = await colaboradoresRes.json()
        setColaboradores(colaboradoresData)
      }

      if (historicoRes.ok) {
        const historicoData = await historicoRes.json()
        setHistorico(historicoData)
      }

      if (folgasRes.ok) {
        const folgasData = await folgasRes.json()
        setSolicitacoesFolga(folgasData)
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err)
    }
  }

  const cadastrarColaborador = async () => {
    if (
      !novoColaborador.nome ||
      !novoColaborador.cracha ||
      !novoColaborador.codigoAcesso ||
      !novoColaborador.dataNascimento ||
      !novoColaborador.cargo ||
      !novoColaborador.supervisor ||
      !novoColaborador.turno ||
      !novoColaborador.telefone
    ) {
      setError("Todos os campos são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoColaborador),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador cadastrado com sucesso!")
        setNovoColaborador({
          nome: "",
          cracha: "",
          codigoAcesso: "",
          dataNascimento: "",
          cargo: "",
          supervisor: "",
          turno: "",
          telefone: "+55 ",
        })
        carregarDados()
      } else {
        setError(data.error || "Erro ao cadastrar colaborador")
      }
    } catch (err) {
      setError("Erro ao cadastrar colaborador")
    } finally {
      setLoading(false)
    }
  }

  const lancarHoras = async () => {
    if (!lancamentoHoras.colaboradorId || !lancamentoHoras.horas) {
      setError("Colaborador e horas são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/horas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colaboradorId: Number.parseInt(lancamentoHoras.colaboradorId),
          horas: Number.parseInt(lancamentoHoras.horas),
          motivo: lancamentoHoras.motivo,
          criadoPor: lancamentoHoras.criadoPor,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Horas lançadas com sucesso!")
        setLancamentoHoras({ colaboradorId: "", horas: "", motivo: "", criadoPor: "Administrador" })
        carregarDados()
      } else {
        setError(data.error || "Erro ao lançar horas")
      }
    } catch (err) {
      setError("Erro ao lançar horas")
    } finally {
      setLoading(false)
    }
  }

  const desbloquearColaborador = async () => {
    if (!tokenDesbloqueio.token || !tokenDesbloqueio.novoCodigoAcesso) {
      setError("Token e novo código são obrigatórios")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/desbloquear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenDesbloqueio),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Colaborador desbloqueado com sucesso!")
        setTokenDesbloqueio({ token: "", novoCodigoAcesso: "" })
        carregarDados()
      } else {
        setError(data.error || "Erro ao desbloquear colaborador")
      }
    } catch (err) {
      setError("Erro ao desbloquear colaborador")
    } finally {
      setLoading(false)
    }
  }

  const processarSolicitacaoFolga = async (id: number, status: "aprovada" | "recusada") => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/admin/folgas/processar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`Solicitação ${status} com sucesso!`)
        carregarDados()
      } else {
        setError(data.error || "Erro ao processar solicitação")
      }
    } catch (err) {
      setError("Erro ao processar solicitação")
    } finally {
      setLoading(false)
    }
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

  const handleLogout = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            </div>
            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 bg-transparent self-start sm:self-auto"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Gerenciamento do sistema de banco de horas</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 sm:mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="colaboradores" className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-5 min-w-[600px] sm:min-w-0 h-auto p-1">
              <TabsTrigger
                value="colaboradores"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Colaboradores</span>
                <span className="xs:hidden">Colab.</span>
              </TabsTrigger>
              <TabsTrigger
                value="cadastro"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Cadastro</span>
                <span className="xs:hidden">Cad.</span>
              </TabsTrigger>
              <TabsTrigger
                value="horas"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Lançar Horas</span>
                <span className="xs:hidden">Horas</span>
              </TabsTrigger>
              <TabsTrigger
                value="agendamento"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Agendamento</span>
                <span className="xs:hidden">Agenda</span>
              </TabsTrigger>
              <TabsTrigger
                value="desbloqueio"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
              >
                <Unlock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Desbloqueio</span>
                <span className="xs:hidden">Desbl.</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Colaboradores Tab */}
          <TabsContent value="colaboradores">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Lista de Colaboradores</CardTitle>
                <CardDescription className="text-sm">Visualize todos os colaboradores cadastrados</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {colaboradores.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm sm:text-base">Nenhum colaborador cadastrado</p>
                  ) : (
                    <div className="grid gap-3 sm:gap-4">
                      {colaboradores.map((colaborador) => (
                        <div
                          key={colaborador.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4"
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm sm:text-base truncate">{colaborador.nome}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Crachá: {colaborador.cracha}</p>
                              <div className="sm:hidden mt-1 space-y-1">
                                <p className="text-xs text-gray-500">{colaborador.cargo}</p>
                                <p className="text-xs text-gray-500">Sup: {colaborador.supervisor}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {colaborador.bloqueado ? (
                              <Badge variant="destructive" className="text-xs">
                                Bloqueado
                              </Badge>
                            ) : (
                              <Badge variant="default" className="text-xs">
                                Ativo
                              </Badge>
                            )}
                            {colaborador.tentativas_codigo > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {colaborador.tentativas_codigo}/3 tentativas
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cadastro Tab */}
          <TabsContent value="cadastro">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Cadastrar Novo Colaborador</CardTitle>
                <CardDescription className="text-sm">Adicione um novo colaborador ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nome" className="text-sm font-medium">
                      Nome Completo *
                    </Label>
                    <Input
                      id="nome"
                      value={novoColaborador.nome}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, nome: e.target.value })}
                      placeholder="Ex: João Silva Santos"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cracha" className="text-sm font-medium">
                      Número do Crachá *
                    </Label>
                    <Input
                      id="cracha"
                      value={novoColaborador.cracha}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, cracha: e.target.value })}
                      placeholder="Ex: 001"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento" className="text-sm font-medium">
                      Data de Nascimento *
                    </Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={novoColaborador.dataNascimento}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, dataNascimento: e.target.value })}
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone" className="text-sm font-medium">
                      Telefone *
                    </Label>
                    <Input
                      id="telefone"
                      value={novoColaborador.telefone}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, telefone: e.target.value })}
                      placeholder="+55 (11) 99999-9999"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="cargo" className="text-sm font-medium">
                      Cargo *
                    </Label>
                    <select
                      id="cargo"
                      className="w-full p-2 sm:p-3 border rounded-md bg-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={novoColaborador.cargo}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, cargo: e.target.value })}
                    >
                      <option value="">Escolha uma opção</option>
                      <option value="Operador Empilhadeira">Operador Empilhadeira</option>
                      <option value="Operador de Transpaleteira">Operador de Transpaleteira</option>
                      <option value="Auxiliar">Auxiliar</option>
                      <option value="Conferente II">Conferente II</option>
                      <option value="Conferente I">Conferente I</option>
                      <option value="Portaria">Portaria</option>
                      <option value="Manutenção">Manutenção</option>
                      <option value="Controlador">Controlador</option>
                      <option value="Assistente Administrativo">Assistente Administrativo</option>
                      <option value="Analista Jr">Analista Jr</option>
                      <option value="Assistente">Assistente</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor" className="text-sm font-medium">
                      Supervisor *
                    </Label>
                    <select
                      id="supervisor"
                      className="w-full p-2 sm:p-3 border rounded-md bg-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={novoColaborador.supervisor}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, supervisor: e.target.value })}
                    >
                      <option value="">Escolha uma opção</option>
                      <option value="Welton Andrade">Welton Andrade</option>
                      <option value="Arlem Brito">Arlem Brito</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="turno" className="text-sm font-medium">
                      Turno *
                    </Label>
                    <select
                      id="turno"
                      className="w-full p-2 sm:p-3 border rounded-md bg-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={novoColaborador.turno}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, turno: e.target.value })}
                    >
                      <option value="">Escolha uma opção</option>
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoAcesso" className="text-sm font-medium">
                      Código de Acesso *
                    </Label>
                    <Input
                      id="codigoAcesso"
                      type="password"
                      value={novoColaborador.codigoAcesso}
                      onChange={(e) => setNovoColaborador({ ...novoColaborador, codigoAcesso: e.target.value })}
                      placeholder="Digite o código de acesso"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>

                <Button
                  onClick={cadastrarColaborador}
                  disabled={loading}
                  className="w-full py-2 sm:py-3 text-sm sm:text-base"
                >
                  {loading ? "Cadastrando..." : "Cadastrar Colaborador"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lançar Horas Tab */}
          <TabsContent value="horas">
            <div className="grid gap-4 sm:gap-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Lançar Horas</CardTitle>
                  <CardDescription className="text-sm">
                    Registre horas trabalhadas ou ajustes para colaboradores
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="colaborador" className="text-sm font-medium">
                        Colaborador
                      </Label>
                      <select
                        id="colaborador"
                        className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={lancamentoHoras.colaboradorId}
                        onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, colaboradorId: e.target.value })}
                      >
                        <option value="">Selecione um colaborador</option>
                        {colaboradores.map((colaborador) => (
                          <option key={colaborador.id} value={colaborador.id}>
                            {colaborador.nome} - Crachá {colaborador.cracha}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="horas" className="text-sm font-medium">
                        Horas (use - para negativo)
                      </Label>
                      <Input
                        id="horas"
                        type="number"
                        value={lancamentoHoras.horas}
                        onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, horas: e.target.value })}
                        placeholder="Ex: 8 ou -2"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motivo" className="text-sm font-medium">
                      Motivo (opcional)
                    </Label>
                    <Textarea
                      id="motivo"
                      value={lancamentoHoras.motivo}
                      onChange={(e) => setLancamentoHoras({ ...lancamentoHoras, motivo: e.target.value })}
                      placeholder="Descreva o motivo do lançamento..."
                      className="text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                    />
                  </div>
                  <Button onClick={lancarHoras} disabled={loading} className="w-full py-2 sm:py-3 text-sm sm:text-base">
                    {loading ? "Lançando..." : "Lançar Horas"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Histórico Recente</CardTitle>
                  <CardDescription className="text-sm">Últimos lançamentos realizados</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {historico.length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm sm:text-base">Nenhum lançamento encontrado</p>
                  ) : (
                    <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                      {historico.slice(0, 10).map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-gray-50 rounded-lg gap-2 sm:gap-4"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{item.colaborador_nome}</p>
                            <p className="text-xs sm:text-sm text-gray-600">{formatarData(item.data_lancamento)}</p>
                            {item.motivo && (
                              <p className="text-xs sm:text-sm text-gray-800 mt-1 break-words">{item.motivo}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Por: {item.criado_por}</p>
                          </div>
                          <Badge
                            variant={item.horas >= 0 ? "default" : "destructive"}
                            className="text-xs self-start sm:self-auto sm:ml-2"
                          >
                            {formatarHoras(item.horas)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agendamento Tab */}
          <TabsContent value="agendamento">
            <div className="grid gap-4 sm:gap-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Solicitações de Folga Pendentes</CardTitle>
                  <CardDescription className="text-sm">
                    Aprove ou recuse as solicitações de folga dos colaboradores
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {solicitacoesFolga.filter((s) => s.status === "pendente").length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm sm:text-base">Nenhuma solicitação pendente</p>
                  ) : (
                    <div className="space-y-4">
                      {solicitacoesFolga
                        .filter((s) => s.status === "pendente")
                        .map((solicitacao) => (
                          <div key={solicitacao.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                                  <h3 className="font-semibold text-sm sm:text-base">{solicitacao.colaborador_nome}</h3>
                                  <Badge variant="outline" className="text-xs self-start sm:self-auto">
                                    Crachá {solicitacao.colaborador_cracha}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                                  <p>
                                    <strong>Data da folga:</strong>{" "}
                                    {new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")}
                                  </p>
                                  <p>
                                    <strong>Dia da semana:</strong> {solicitacao.dia_semana}
                                  </p>
                                  <p>
                                    <strong>Horas a debitar:</strong> {solicitacao.horas_debitar}h
                                  </p>
                                  <p>
                                    <strong>Solicitado em:</strong> {formatarData(solicitacao.data_solicitacao)}
                                  </p>
                                </div>
                                {solicitacao.motivo && (
                                  <p className="text-xs sm:text-sm bg-white p-2 rounded border break-words">
                                    <strong>Motivo:</strong> {solicitacao.motivo}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-row lg:flex-col gap-2 lg:ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => processarSolicitacaoFolga(solicitacao.id, "aprovada")}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700 flex-1 lg:flex-none text-xs sm:text-sm"
                                >
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => processarSolicitacaoFolga(solicitacao.id, "recusada")}
                                  disabled={loading}
                                  className="flex-1 lg:flex-none text-xs sm:text-sm"
                                >
                                  <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Histórico de Solicitações</CardTitle>
                  <CardDescription className="text-sm">Todas as solicitações de folga processadas</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {solicitacoesFolga.filter((s) => s.status !== "pendente").length === 0 ? (
                    <p className="text-gray-500 text-center py-4 text-sm sm:text-base">
                      Nenhuma solicitação processada
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                      {solicitacoesFolga
                        .filter((s) => s.status !== "pendente")
                        .map((solicitacao) => (
                          <div
                            key={solicitacao.id}
                            className="flex flex-col sm:flex-row sm:justify-between sm:items-start p-3 bg-gray-50 rounded-lg gap-2 sm:gap-4"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <p className="font-medium text-sm sm:text-base truncate">
                                  {solicitacao.colaborador_nome}
                                </p>
                                <Badge variant="outline" className="text-xs self-start sm:self-auto">
                                  Crachá {solicitacao.colaborador_cracha}
                                </Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Folga em: {new Date(solicitacao.data_folga).toLocaleDateString("pt-BR")} (
                                {solicitacao.dia_semana})
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                Processado em:{" "}
                                {formatarData(solicitacao.data_processamento || solicitacao.data_solicitacao)}
                              </p>
                              {solicitacao.motivo && (
                                <p className="text-xs text-gray-500 mt-1 break-words">{solicitacao.motivo}</p>
                              )}
                            </div>
                            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 sm:gap-1">
                              <Badge
                                variant={solicitacao.status === "aprovada" ? "default" : "destructive"}
                                className={`text-xs ${solicitacao.status === "aprovada" ? "bg-green-600" : ""}`}
                              >
                                {solicitacao.status === "aprovada" ? "Aprovada" : "Recusada"}
                              </Badge>
                              <span className="text-xs text-gray-500">{solicitacao.horas_debitar}h</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Desbloqueio Tab */}
          <TabsContent value="desbloqueio">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Desbloquear Colaborador</CardTitle>
                <CardDescription className="text-sm">
                  Use o token fornecido pelo colaborador para desbloqueá-lo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="text-sm font-medium">
                      Token de Desbloqueio
                    </Label>
                    <Input
                      id="token"
                      value={tokenDesbloqueio.token}
                      onChange={(e) =>
                        setTokenDesbloqueio({ ...tokenDesbloqueio, token: e.target.value.toUpperCase() })
                      }
                      placeholder="Ex: A1B2C3D4"
                      className="font-mono text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="novoCodigoAcesso" className="text-sm font-medium">
                      Novo Código de Acesso
                    </Label>
                    <Input
                      id="novoCodigoAcesso"
                      type="password"
                      value={tokenDesbloqueio.novoCodigoAcesso}
                      onChange={(e) => setTokenDesbloqueio({ ...tokenDesbloqueio, novoCodigoAcesso: e.target.value })}
                      placeholder="Digite o novo código"
                      className="text-sm sm:text-base"
                    />
                  </div>
                </div>
                <Button
                  onClick={desbloquearColaborador}
                  disabled={loading}
                  className="w-full py-2 sm:py-3 text-sm sm:text-base"
                >
                  {loading ? "Desbloqueando..." : "Desbloquear Colaborador"}
                </Button>

                {/* Lista de colaboradores bloqueados */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">Colaboradores Bloqueados</h3>
                  {colaboradores.filter((c) => c.bloqueado).length === 0 ? (
                    <p className="text-gray-500 text-xs sm:text-sm">Nenhum colaborador bloqueado</p>
                  ) : (
                    <div className="space-y-2">
                      {colaboradores
                        .filter((c) => c.bloqueado)
                        .map((colaborador) => (
                          <div
                            key={colaborador.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg gap-2 sm:gap-4"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base truncate">{colaborador.nome}</p>
                              <p className="text-xs sm:text-sm text-gray-600">Crachá: {colaborador.cracha}</p>
                            </div>
                            {colaborador.ultimo_token_bloqueio && (
                              <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
                                {colaborador.ultimo_token_bloqueio}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
