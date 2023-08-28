variable "env" {}

variable "region" {
  default = "eu-west-3"
}

variable "name" {
  default = "PFIAS"
}
variable "domain" {
  default = "france"
}

variable "acm_certificate_arn" {
  default = "arn:aws:acm:us-east-1:720928668014:certificate/af936a71-516a-40fc-8187-121807242a41"
}
