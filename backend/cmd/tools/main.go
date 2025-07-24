package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {

	password, err := bcrypt.GenerateFromPassword([]byte("admin123"), 12)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(string(password))

	if err := bcrypt.CompareHashAndPassword(password, []byte("admin123")); err == nil {
		fmt.Println("Password is correct")
	} else {
		fmt.Println("Password is incorrect")
	}
}
