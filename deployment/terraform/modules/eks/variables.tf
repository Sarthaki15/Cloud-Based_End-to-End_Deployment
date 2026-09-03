variable "environment" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "eks_version" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "node_group_name" {
  type = string
}

variable "ami_type" {
  type = string
}

variable "capacity_type" {
  type = string
}

variable "instance_types" {
  type = list(string)
}

variable "disk_size" {
  type = number
}

variable "desired_size" {
  type = number
}

variable "min_size" {
  type = number
}

variable "max_size" {
  type = number
}

variable "max_unavailable" {
  type = number
}