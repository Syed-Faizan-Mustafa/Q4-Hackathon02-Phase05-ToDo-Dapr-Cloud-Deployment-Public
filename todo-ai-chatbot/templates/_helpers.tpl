{{/*
Expand the name of the chart.
*/}}
{{- define "todo-ai-chatbot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-ai-chatbot.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Frontend fully qualified name.
*/}}
{{- define "todo-ai-chatbot.frontend.fullname" -}}
{{- printf "%s-frontend" (include "todo-ai-chatbot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Backend fully qualified name.
*/}}
{{- define "todo-ai-chatbot.backend.fullname" -}}
{{- printf "%s-backend" (include "todo-ai-chatbot.fullname" .) | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "todo-ai-chatbot.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-ai-chatbot.labels" -}}
helm.sh/chart: {{ include "todo-ai-chatbot.chart" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "todo-ai-chatbot.frontend.labels" -}}
{{ include "todo-ai-chatbot.labels" . }}
app.kubernetes.io/name: {{ include "todo-ai-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "todo-ai-chatbot.frontend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-ai-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Backend labels
*/}}
{{- define "todo-ai-chatbot.backend.labels" -}}
{{ include "todo-ai-chatbot.labels" . }}
app.kubernetes.io/name: {{ include "todo-ai-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "todo-ai-chatbot.backend.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-ai-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "todo-ai-chatbot.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "todo-ai-chatbot.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
