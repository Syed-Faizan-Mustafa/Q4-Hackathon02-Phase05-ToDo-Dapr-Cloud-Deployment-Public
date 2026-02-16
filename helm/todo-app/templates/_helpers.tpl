{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end }}

{{/*
Selector labels for a specific component
*/}}
{{- define "todo-app.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .instance }}
{{- end }}

{{/*
Dapr annotations
*/}}
{{- define "todo-app.daprAnnotations" -}}
dapr.io/enabled: "true"
dapr.io/app-id: {{ .appId | quote }}
dapr.io/app-port: {{ .appPort | quote }}
dapr.io/log-level: "info"
{{- end }}
