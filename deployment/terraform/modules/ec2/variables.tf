variable "environment" {
  type = string
}

variable "instance_count" {
  type = number
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "security_group_id" {
  type = string
}

variable "key_name" {
  type = string
}

variable "root_volume_size" {
  type = number
}

variable "instance_profile_name" {
  type = string
}