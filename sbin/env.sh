

f_export() {
	export test="Test"
        v=$(sudo ./config.sh)
	echo $v
}

f_write2apache(){
	echo "writing to apache"
}


# Check the first parameter and call the respective function
case "$1" in
    export)
        f_export
        ;;
    write2apache)
        f_apache
        ;;
    *)
        echo "Usage: $0 {export|write2apache}"
        ;;
esac
