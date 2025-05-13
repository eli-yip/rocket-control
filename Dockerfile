FROM golang:1.24-alpine AS builder

ARG VERSION="0.0.0"

WORKDIR /app

COPY go.mod go.sum ./

RUN go env -w GO111MODULE=on && \
  go mod download

COPY . .

RUN go build -ldflags "-X github.com/eli-yip/rocket-control/version.Version=${VERSION}" -tags="timetzdata" -o server .

FROM alpine:3.21

WORKDIR /app

COPY --link --from=builder /app/server .

RUN apk add --no-cache -U tzdata

ENV TZ=Asia/Shanghai

EXPOSE 8080

ENTRYPOINT ["./server"]